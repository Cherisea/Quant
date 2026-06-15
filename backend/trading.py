"""
Strategy/analysis layer and position tracking for the momentum bot.

All broker I/O now lives behind brokers.BrokerAdapter class. This modules keeps:
    - TechAnalyst: pure indicator/signal computations over a DataFrame.
    - PositionManager: in-memory position and trailing stop state, seeded from the broker.
    - PriceCache: optional local Postgres cache for OHLCV bars.

"""

# System and third-party imports
import logging
import pandas as pd
from brokers import BrokerAdapter
from configs import AppSettings, LoggingSettings

LoggingSettings()
log = logging.getLogger(__name__)   # Initialize a named logger 

class TechAnalyst:
    """An analyst that pulls market data, compute technical indicators and generate trading signals.
    """
    def __init__(self, settings: AppSettings) -> None:
        self.strategy = settings.strategy

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators such as fast EMA, slow EMA, rate of change and average volume.

        Returns:
            Original dataframe with derived columns of technical indicators.
        """ 
        df = df.copy()
        df["fast_ema"] = df["close"].ewm(span=self.strategy.fast_ema, adjust=False).mean()
        df["slow_ema"] = df["close"].ewm(span=self.strategy.slow_ema, adjust=False).mean()
        df["roc"] = df["close"].pct_change(self.strategy.roc_period)
        df["vol_ma"] = df["volume"].rolling(self.strategy.vol_ma).mean()
        return df

    def get_latest_signal(self, df: pd.DataFrame) -> int:
        """ Retrieve yesterday's trading signal for today's transaction.
        """
        return self.get_all_signals(df).iloc[-2]['signal']

    def get_all_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals for all rows of a dataframe. This method is 
            designed for backtesting.

        Args:
            client: a functional trading client
            df: data of target stocks
        
        Returns:
            A modified dataframe with a new "signal" column.
        """
        df = df.copy()
        df['signal'] = 0

        # Moment of transition where fast and slow ema flips position
        cross_up = (df['fast_ema'] > df['slow_ema']) & (df['fast_ema'].shift(1) <= df['slow_ema'].shift(1))
        cross_down = (df['fast_ema'] < df['slow_ema']) & (df['fast_ema'].shift(1) >= df['slow_ema'].shift(1))

        momentum = df['roc'] > self.strategy.roc_threshold
        volume = df['volume'] > self.strategy.vol_coefficient * df['vol_ma']

        df.loc[cross_up & (momentum | volume), 'signal'] = 1     # Buy signal
        df.loc[cross_down, "signal"] = -1        # Sell signal

        return df

class PositionManager:
    """A manager that tracks current position, entry price and trailing stop orders.
    """
    def __init__(self, broker: BrokerAdapter, lot_size: int, settings: AppSettings) -> None:
        self.risk = settings.risk
        self.broker = broker
        self.lot_size = lot_size

        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0      # Updated for trailing stop orders
        self._sync_from_broker()

    def _sync_from_broker(self):
        """Read actual positions and average cost from Tiger Trade on startup.
        """
        pos = self.broker.get_position()
        if pos and pos.quantity:
            self.position = int(pos.quantity)
            self.entry_price = float(pos.average_cost)
            self.highest_since_entry = self.entry_price
            log.info(f"Synced position: {self.position} shares @ {self.entry_price:.3f}")
        else:
            log.info(f"No existing position in {self.broker.symbol}")

    def close_pos(self):
        """Close all positions in an account.
        """
        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0
    
    def get_balance(self) -> float:
        return self.broker.get_cash()
    
    def check_trailing_stop(self, current_price: float) -> bool:
        """Check if a trailing stop order set at a fixed percentage point should be triggered. Note
            this order lives on the software side, not broker side. Move it to the broker side
            to ensure it still triggers even when the bot experiences downtime.
        
        Args:
            current_price: current price of security.
        
        Returns:
            True if a trailing stop order should be triggered; otherwise False.
        """
        if self.position <= 0:
            return False
        
        self.highest_since_entry = max(self.highest_since_entry, current_price)
        stop_point = self.highest_since_entry * (1 - self.risk.stop_loss_pct)
        if current_price <= stop_point:
            log.warning(f"TRAILING STOP HIT: price = {current_price}, stop={stop_point}, peak={self.highest_since_entry}")
            return True
        return False

