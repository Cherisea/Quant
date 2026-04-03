"""
A trading bot that operates on simple momentum strategy.
"""

# System and third-party imports
import sys
import time
import logging
from typing import Optional
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
from tigeropen.common.util.order_utils import limit_order, market_order
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
            log.warning(f"{e}. Could not verify lot size. Using default size of {ls}")
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
    def account(self):
        """Expose Tiger account as a read-only attribute.
        """
        return self.cfg.account or settings.broker.tiger_account  
    
    @property
    def stop_loss_pct(self):
        """Expose the percentage value that triggers stop loss orders as a 
            read_only attribute.
        """
        return settings.risk.stop_loss_pct
    
    @property
    def limit_buffer_bps(self):
        """Expose limit buffer base points as a read_only attribute.
        """
        return settings.risk.limit_buffer_bps
    
    @property
    def max_wait_sec(self):
        """Expose max wait time as a read_only attribute.
        """
        return settings.risk.max_wait_sec

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
    def __init__(self, clients:TigerClients, lot_size: int) -> None:
        self.clients = clients
        self.lot_size = lot_size

        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0
        self._sync_from_broker()

    def _sync_from_broker(self):
        """Read actual positions and average cost from Tiger Trade on startup.
        """
        try:
            data = self.clients.trade.get_positions(account=client.account, 
                    sec_type=SecurityType.STK, symbol=client.symbol)
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
    
    def get_balance(self) -> float:
        """Fetch available cash from broker account.
        """
        try:
            data = self.clients.trade.get_assets(account=self.clients.account)
            if data is not None:
                cash = data[0].summary.cash
                return cash
        except Exception as e:
            log.warning(f"Couldn't fetch balance: {e}")
        return 0.0
    
    def round_to_lot(self, qty: int) -> int:
        """Round requested quantity to a multiple of lot size.
        """
        return (qty // self.lot_size) * self.lot_size
    
    def check_trailing_stop(self, current_price: float) -> bool:
        """Check if a trailing stop order set at a fixed percentage point is triggered. Note
            this order lives on the software side, not broker side. Move it to the broker side
            to ensure it still triggers even when the bot experiences downtime.
        """
        if self.position <= 0:
            return False
        
        self.highest_since_entry = max(self.highest_since_entry, current_price)
        stop_point = self.highest_since_entry * (1 - self.clients.stop_loss_pct)
        if current_price <= stop_point:
            log.warning(f"TRAILING STOP HIT: price = {current_price}, stop={stop_point}, peak={self.highest_since_entry}")
            return True
        return False

class OrderExecutor:
    """A class for executing limit buy and sell orders.
    """
    def __init__(self, clients: TigerClients) -> None:
        self.client = clients

    def get_last_price(self) -> float:
        """Fetch latest closing price of a security. Be mindful of exchange imposed price quote delay.

        Returns:
            Security price as a float.
        """
        brief = self.client.quote.get_stock_briefs([self.client.symbol])
        return brief['close'].iloc[0]

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
            lim_price = round(ref_price * (1 + self.client.limit_buffer_bps / 10_000), 3)
        else:
            lim_price = round(ref_price * (1 - self.client.limit_buffer_bps / 10_000), 3)

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
        while time.time() - start < self.client.max_wait_sec:
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
        log.warning(f"Order {order_id} not filled after {self.client.max_wait_sec} -- cancelling")
        try:
            self.client.trade.cancel_order(id=order_id)
        except Exception as e:
            log.error(f"Failed to cancel order: {e}")
        return False 


client = TigerClients()
print(client.account)
manager = PositionManager(client, 500)
exe = OrderExecutor(client)
exe.place_limit_order(500, 10.28, "BUY")

