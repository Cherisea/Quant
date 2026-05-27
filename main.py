"""
A live momentum trading bot that connects to Tiger Trade via tigeropen SDK. Trading strategy can be configured in a 
separate script. 
"""

# System and third-party imports
import time
import signal
import schedule
import logging
import pandas as pd

from utils import setup_logging, round_to_lot
from typing import Optional
from datetime import datetime
from configs import AppSettings, load_settings


# Tiger trade SDK
from tigeropen.common.consts import (
    BarPeriod, QuoteRight,
    SecurityType, OrderStatus
)
from tigeropen.quote.quote_client import QuoteClient
from tigeropen.trade.trade_client import TradeClient
from tigeropen.common.util.contract_utils import stock_contract
from tigeropen.common.util.order_utils import limit_order
from tigeropen.tiger_open_config import TigerOpenClientConfig

settings = load_settings()

# Load logger settings from root logger
setup_logging(settings.logging.file, settings.logging.level)
log = logging.getLogger(__name__)   # Initialize a named logger 

class TigerClient:
    """Quote and trade agent for interacting with Tiger Trade platform.
    """
    def __init__(self, settings: AppSettings) -> None:
        self.symbol = settings.broker.symbol
        self.settings = settings
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
            return ls.item()
        except Exception as e:
            ls = self.settings.broker.lot_size
            log.warning(f"{e}. Could not verify lot size. Using default size of {ls}")
            return ls.item()

    def _build_config(self) -> TigerOpenClientConfig:
        """Configure tiger client by retrieving constants from settings.
        """
        if self.settings.broker.props_path:
            cfg = TigerOpenClientConfig(props_path=self.settings.broker.props_path)
        else:
            cfg = TigerOpenClientConfig()
            cfg.private_key = self.settings.broker.private_key
            cfg.tiger_id = self.settings.broker.tiger_id
            cfg.tiger_account = self.settings.broker.tiger_account
        cfg.timezone = self.settings.broker.tz
        return cfg

class TechAnalyst:
    """An analyst that pulls market data, compute technical indicators and generate trading signals.
    """
    def __init__(self, client: TigerClient, settings: AppSettings) -> None:
        self.client = client
        self.strategy = settings.strategy
        self.risk = settings.risk
    
    def get_last_price(self) -> float:
        """Fetch latest closing price of a security. Be mindful of exchange imposed price quote delay.

        Returns:
            Security price as a float.
        """
        brief = self.client.quote.get_stock_briefs([self.client.symbol])
        return brief['close'].iloc[0]

    def fetch_bars(self, test: bool=False, test_duration: int=3) -> pd.DataFrame:
        """Fetch historical OHLC data.

        Args:
            test: if backtest mode is on or not
            test_duration: how far back to pull historical price data for backtest. 
                            Measured in years.

        Returns:
            A dataframe with a set number of rows containing historical price information of a 
            preset security.
        """
        if test:
            # Resets to midnight local time
            end = pd.Timestamp.now().normalize()
            start = end - pd.DateOffset(years=test_duration)

            bars = self.client.quote.get_bars(
                symbols= [self.client.symbol],
                period= BarPeriod.DAY,
                right= QuoteRight.BR,
                begin_time= start.strftime("%Y-%m-%d"),
                end_time= end.strftime("%Y-%m-%d"),
            )
        else:
            bars = self.client.quote.get_bars(
                symbols = [self.client.symbol],
                period = BarPeriod.DAY,     # Timeframe of each candlestick bar
                right = QuoteRight.BR,      # Historical prices are adjusted for corporate actions
                limit = self.risk.lookback_bars       # Number of days to pull data
            )

        if bars is None or bars.empty:
            raise RuntimeError("Failed to fetch bar data.") 
        
        # Convert numeric time to a human-readable format
        bars["time"] = pd.to_datetime(bars["time"], unit="ms")
        bars.set_index("time", inplace=True)
        bars.sort_index(inplace=True)
        return bars

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

    def get_latest_signal(self, df: pd.DataFrame) -> str:
        """Generate trading signals by evaluating price actions of the last two days.

        Returns:
            "BUY" if a cross-up signal is detected, "SELL" if a cross-down is observed. Otherwise "Hold".
        """
        if len(df) <= 2:
            return "Hold"

        prev = df.iloc[-2]
        cur = df.iloc[-1]

        # Check if EMA crosses up or down in the last two days
        cross_up = (prev['fast_ema'] <= prev['slow_ema']) and (cur['fast_ema'] > cur['slow_ema'])
        cross_down = (prev['fast_ema'] > prev['slow_ema']) and (cur['fast_ema'] <= cur['slow_ema'])

        if cross_up and cur['roc'] > self.strategy.roc_threshold and cur['volume'] > cur['vol_ma'] * self.strategy.vol_coefficient:
            return "Buy"
        elif cross_down:
            return "Sell"
        else:
            return "Hold" 

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

        df.loc[cross_up & momentum & volume, 'signal'] = 1     # Buy signal
        df.loc[cross_down, "signal"] = -1        # Sell signal

        return df

class PositionManager:
    """A manager that tracks current position, entry price and trailing stop orders.
    """
    def __init__(self, clients:TigerClient, lot_size: int, settings: AppSettings) -> None:
        self.clients = clients
        self.risk = settings.risk
        self.broker = settings.broker
        self.lot_size = lot_size

        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0      # Updated for trailing stop orders
        self._sync_from_broker()

    def _sync_from_broker(self):
        """Read actual positions and average cost from Tiger Trade on startup.
        """
        try:
            data = self.clients.trade.get_positions(account=self.broker.tiger_account, 
                    sec_type=SecurityType.STK, symbol=self.clients.symbol)
            if data is not None and len(data) != 0:
                row = data[0]
                self.position = int(row.quantity)
                self.entry_price = float(row.average_cost)
                self.highest_since_entry = self.entry_price
                log.info(f"Synced position: {self.position} shares @{self.entry_price:.3f}")
            else:
                log.info(f"No existing position in {self.clients.symbol}")
        except Exception as e:
            log.warning(f"Couldn't sync position: {e}")

    def close_pos(self):
        """Close all positions in an account.
        """
        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0
    
    def get_balance(self) -> float:
        """Fetch available cash from prime/paper account.

        Returns:
            Balance in account if no exception is thrown, otherwise returns 0.0.
        """
        try:
            data = self.clients.trade.get_prime_assets(account=self.broker.tiger_account)
            cash = data.segments['S'].currency_assets.get(self.clients.currency).cash_available_for_trade
            if cash <= 0:
                log.warning(f"No {self.clients.currency} cash available for trading {self.clients.symbol}.")
            else:
                return cash 
        except Exception as e:
            log.warning(f"Couldn't fetch balance: {e}")
        return 0.0
    
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

class OrderExecutor:
    """An executor for placing limit buy and sell orders.
    """
    def __init__(self, clients: TigerClient, settings: AppSettings) -> None:
        self.client = clients
        self.risk = settings.risk

    def place_limit_order(self, qty: int, ref_price: float, direct: str) -> Optional[int]:
        """Place a limit order priced at a certain range of reference price.

        Args:
            qty: number of shares that's a multiple of lot size.
            ref_price: base price an order is placed at.
            direct: direction of order. Must be either "BUY" or "SELL".
        
        Return:
            None if order is successfully placed, or order id as an integer if operation succeeds.
        """
        if direct not in ["BUY", "SELL"]:
            raise ValueError("Direction of limit orders must be either buy or sell. Aborting...")
        
        if direct == "BUY":
            lim_price = round(ref_price * (1 + self.risk.limit_buffer_bps / 10_000), 3)
        else:
            lim_price = round(ref_price * (1 - self.risk.limit_buffer_bps / 10_000), 3)

        order = limit_order(
            account=self.client.account,
            contract=self.client.contract,
            action=direct,
            limit_price=lim_price,
            quantity=qty,
        )
        try:
            self.client.trade.place_order(order)
            log.info(f"{direct} order placed: {qty} at {lim_price}, order_id={order.id}")
            return order.id
        except Exception as e:
            log.error(f"Failed to place {direct} order: {e}")
            return None

    def wait_for_fill(self, order_id: int) -> bool:
        """Poll order status until filled or timeout, then cancel if unfilled.

        Args:
            order_id: order to be operated on.
        
        Returns:
            True if order is filled, otherwise False. Check logs for details.
        """
        start = time.time()
        while time.time() - start < self.risk.max_wait_sec:
            try:
                order = self.client.trade.get_order(id=order_id)
                status = order.status if hasattr(order, "status") else None
                if status in (OrderStatus.FILLED, "Filled", "FILLED"):
                    log.info(f"Order {order_id} FILLED (avg_price={getattr(order, 'avg_filled_price', 0)})")
                    return True
                if status in (OrderStatus.CANCELLED, OrderStatus.REJECTED, 
                                "Cancelled", "Rejected", "CANCELLED", "REJECTED"):
                    log.warning(f"Order {order_id} was {status}")
                    return False
            except Exception as e:
                log.warning(f"Error polling order {order_id}: {e}")
            time.sleep(3)

        # Timeout - cancel the order
        log.warning(f"Order {order_id} not filled after {self.risk.max_wait_sec} -- cancelling")
        try:
            self.client.trade.cancel_order(id=order_id)
        except Exception as e:
            log.error(f"Failed to cancel order: {e}")
        return False 

class MomentumBot:
    
    def __init__(self, settings: AppSettings) -> None:
        self.client = TigerClient(settings)
        self.lot_size = self.client.verify_lot_size()
        self.risk = settings.risk
        self.broker = settings.broker
        self.strategy = settings.strategy

        self.pm = PositionManager(self.client, self.lot_size, settings)
        self.analyst = TechAnalyst(self.client, settings)
        self.executor = OrderExecutor(self.client, settings)
        self._running = True

        # Register system signals with a custom function
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self):
        """Custom signal handler.
        """
        log.info("Shutdown signal received -- stopping bot.")
        self._running = False

    def is_market_hours(self) -> bool:
        """Check if market is open.

        Returns:
            True if market is open, False otherwise.
        """
        now = datetime.now().time()
        lunch_start = datetime.strptime(settings.schedule.lunch_start, "%H:%M").time()
        lunch_end = datetime.strptime(settings.schedule.lunch_end, "%H:%M").time()
        market_open = datetime.strptime(settings.schedule.market_open, "%H:%M").time()
        market_close = datetime.strptime(settings.schedule.market_close, "%H:%M").time()
        if lunch_start <= now <= lunch_end:
            return False
        return market_open < now < market_close

    def tick(self):
        """One evaluation cycle.
        """
        if not self.is_market_hours():
            return

        try:
            # Analyst: fetch data and compute trading signals
            bars = self.analyst.fetch_bars()
            bars = self.analyst.compute_indicators(bars)
            sig = self.analyst.get_latest_signal(bars)
            latest_price = self.analyst.get_last_price()

            fast_ema = bars.iloc[-1]['fast_ema']
            slow_ema = bars.iloc[-1]['slow_ema']
            roc = bars.iloc[-1]['roc']
            pos = self.pm.position
            log.info("TICK: price=%.3f | fast_ema=%.3f | slow_ema=%.3f | roc=%.4f | signal=%s | pos=%d",
                    latest_price, fast_ema, slow_ema, roc, sig, pos)
            
            # Trailing stop order check
            if self.pm.check_trailing_stop(latest_price):
                sig = "SELL"
            
            # Execute sell
            if sig == "SELL" and pos > 0:
                order_id = self.executor.place_limit_order(pos, latest_price, "SELL")
                if order_id and self.executor.wait_for_fill(order_id):
                    log.info(f"SOLD {pos} shares of {self.client.symbol}")
                    self.pm.close_pos()
                else:
                    log.warning("SELL order did not fill -- will retry in next tick.")
            
            # Execute buy
            elif sig == "BUY" and self.pm.position == 0:
                equity = self.pm.get_balance()
                budget = equity * self.risk.trade_size_pct
                raw_qty = budget // latest_price
                qty = round_to_lot(raw_qty)
                if qty <= 0:
                    log.warning(f"Insufficient equity for a full lot (equity={equity}, price={latest_price})")
                    return
                
                order_id = self.executor.place_limit_order(qty, latest_price, "BUY")
                if order_id and self.executor.wait_for_fill(order_id):
                    self.pm.position = qty 
                    self.pm.entry_price = latest_price
                    self.pm.highest_since_entry = latest_price
                    log.info(f"BOUGHT {qty} shares of {self.client.symbol} at {latest_price:.3f}")
                else:
                    log.warning("BUY order did not fill -- will retry in next tick.")
        except Exception as e:
            log.warning(f"Error during tick: {e}")
                
    
    def run(self):
        """Main loop -- schedule ticks at a set interval.
        """
        log.info("=" * 60)
        log.info(f"  Momentum Bot STARTED -- Trading {self.client.symbol} on Tiger Trade")
        log.info(f"  Account: {self.broker.tiger_account} | Lot size: {self.lot_size}")
        log.info("  Strategy: EMA(%d/%d)  +  ROC(%.3f)  +  Vol_MA(%d) + Vol_Coefficient(%.1f)",
                    self.strategy.fast_ema, self.strategy.slow_ema, self.strategy.roc_threshold, 
                    self.strategy.vol_ma, self.strategy.vol_coefficient)
        log.info(f"  Position sizing: {self.risk.trade_size_pct} | Stop loss: {self.risk.stop_loss_pct}")
        log.info("=" * 60)

        # Run an immediate tick and schedule the next one
        self.tick()
        schedule.every(settings.schedule.tick_interval).minutes.do(self.tick)

        while self._running:
            schedule.run_pending()      # Run all jobs that are due
            time.sleep(1)

        log.info("Bot stopped cleanly.")

if __name__ == "__main__":
    # Start the bot
    bot = MomentumBot(settings)
    bot.run()

