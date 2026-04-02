"""
A trading bot that operates on simple momentum strategy.
"""

# System and third-party imports
import sys
import logging
import pandas as pd
from settings import load_settings

# Tiger trade imports
from tigeropen.common.consts import (
    Language, Market, BarPeriod, QuoteRight,
    SecurityType, Currency, OrderStatus
)
from tigeropen.quote.quote_client import QuoteClient
from tigeropen.trade.trade_client import TradeClient
from tigeropen.common.util.contract_utils import stock_contract
from tigeropen.tiger_open_config import TigerOpenClientConfig

settings = load_settings()
logging.basicConfig(
    level = settings.logging.level,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(settings.logging.file),
        logging.StreamHandler(sys.stdout)
    ],
)
log = logging.getLogger(__name__)

class TigerClients:
    """A single holder for quote and trade agent.
    """
    def __init__(self) -> None:
        self._symbol = settings.broker.symbol
        self._lot_size = self.verify_lot_size()

        self.cfg = self._build_config()
        self.quote = QuoteClient(self.cfg)
        self.trade = TradeClient(self.cfg)
        self.contract = stock_contract(symbol=self.symbol, currency=settings.broker.currency)    # Security to trade
        log.info(f"Tiger client initialized.")
    
    def verify_lot_size(self) -> int:
        """Fetch actual lot size from exchange metadata.
        """
        try:
            meta = self.quote.get_trade_metas([self.symbol])
            ls = meta["lot_size"].iloc[0]
            log.info(f"Verified lot size for {self.symbol}: {ls}")
            return ls
        except Exception as e:
            ls = settings.broker.lot_size
            log.warning(f"Could not verify lot size. Using default size of {ls}")
            return ls

    @staticmethod
    def _build_config():
        """Configure tiger client by retrieving constants from settings.
        """
        if settings.broker.props_path:
            cfg = TigerOpenClientConfig(props_path=settings.broker.props_path)
        else:
            cfg = TigerOpenClientConfig()
            cfg.private_key = settings.broker.private_key
            cfg.tiger_id = settings.broker.tiger_id
            cfg.tiger_account = settings.broker.tiger_account
        cfg.timezone = settings.broker.tz
        return cfg

    @property
    def lookback_bars(self):
        """Set lookback period as a class property
        """
        return settings.risk.lookback_bars
    
    @property
    def symbol(self):
        """Set stock symbol as a property.
        """
        return self._symbol

    @property
    def fast_ema(self):
        """Set fast EMA as a property.
        """
        return settings.strategy.fast_ema
    
    @property
    def slow_ema(self):
        """Set slow EMA as a property.
        """
        return settings.strategy.slow_ema
    
    @property
    def roc_period(self):
        """Set rate of change as a property.
        """
        return settings.strategy.roc_period

    @property
    def roc_threshold(self):
        """Set ROC threshold as a property.
        """
        return settings.strategy.roc_threshold
    
    @property
    def vol_ma(self):
        """Set moving average volume as a property.
        """
        return settings.strategy.vol_ma
    
    @property
    def vol_coefficient(self):
        """Expose volume coefficient as a read-only attribute.
        """
        return settings.strategy.vol_coefficient

    @property
    def lot_size(self):
        """Expose lot size as a read-only attribute.
        """
        return self._lot_size
    
    @property
    def account(self):
        """Expose Tiger account as a read-only attribute.
        """
        return settings.broker.tiger_account

class TechAnalyst:
    """A technical analyst that pulls market data, compute technical indicators and generate trading signals.
    """
    def __init__(self, client: TigerClients) -> None:
        self.client = client

    def get_bars(self) -> pd.DataFrame:
        """Fetch historical OHLC data.
        """
        bars = self.client.quote.get_bars(
            symbols = [self.client.symbol],
            period = BarPeriod.DAY,     # Timeframe of each candlestick bar
            right = QuoteRight.BR,      # Historical prices are adjusted for corporate actions
            limit = self.client.lookback_bars       # Number of days to pull data
        )

        if bars is None or bars.empty:
            raise RuntimeError("Failed to fetch bar data.") 
        
        # Preprocess fetched data
        bars["time"] = pd.to_datetime(bars["time"], unit="ms")
        bars.set_index("time", inplace=True)
        bars.sort_index(inplace=True)
        return bars

    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators such as fast EMA, slow EMA, rate of change and average volume.
        """ 
        df = df.copy()
        df["fast_ema"] = df["close"].ewm(span=self.client.fast_ema, adjust=False).mean()
        df["slow_ema"] = df["close"].ewm(span=self.client.slow_ema, adjust=False).mean()
        df["roc"] = df["close"].pct_change(self.client.roc_period)
        df["vol_ma"] = df["volume"].rolling(self.client.vol_ma).mean()
        return df

    def get_latest_signal(self, df: pd.DataFrame) -> str:
        """Generate trading signals by evaluating price actions of the last two days.
        """
        if len(df) <= 2:
            return "Hold"

        prev = df.iloc[-2]
        cur = df.iloc[-1]

        # Check if EMA crosses up or down
        cross_up = (prev['fast_ema'] <= prev['slow_ema']) and (cur['fast_ema'] > cur['slow_ema'])
        cross_down = (prev['fast_ema'] > prev['slow_ema']) and (cur['fast_ema'] <= cur['slow_ema'])

        if cross_up and cur['roc'] > self.client.roc_threshold and cur['volume'] > cur['vol_ma'] * self.client.vol_coefficient:
            return "Buy"
        elif cross_down:
            return "Sell"
        else:
            return "Hold" 

class PositionManager:
    """Tracks current position, entry price and trailing stop orders.
    """
    def __init__(self, clients:TigerClients) -> None:
        self.clients = clients
        self.lot_size = self.clients.lot_size
        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0
        self._sync_from_broker()

    def _sync_from_broker(self):
        """Read actual positions from Tiger Trade on startup.
        """
        pass
    
    


client = TigerClients()
