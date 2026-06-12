"""
    Broker abstraction layer that adopts a factory pattern. Defines a single interface the trading 
    engine codes against, so trading strategy never depends on a specific broker's SDK.
"""

import abc
import logging
import time
from datetime import datetime
import pandas as pd
from cache import PriceCache

from typing import Optional
from configs import (AppSettings, Position, OrderResult, OrderSide, 
                     OrderState, LoggingSettings, BAR_COLUMNS)

LoggingSettings()
log = logging.getLogger(__name__)   # Initialize a named logger 

# ================================= Adapter Interface =====================================
class BrokerAdapter(abc.ABC):
    """ The contract every broker must satisfy.
        
        Subclasses must implement the abstract primitives below. The non-abstract
        'execute' orchestration is broker-neutral.
    """

    def __init__(self, settings: AppSettings):
        self.settings = settings
        self.risk = settings.risk
        self.broker = settings.broker
        self.symbol = settings.broker.symbol
        self.currency = settings.broker.currency

    @abc.abstractmethod
    def connect(self):
        """ Establish any clients/sessions the adapter needs. Called once on startup.
        """
    
    @abc.abstractmethod
    def get_lot_size(self) -> int:
        """ Tradable lot size for the configured ticker symbol.
        """
    
    @abc.abstractmethod
    def get_bars(self, start: Optional[str] = None) -> pd.DataFrame:
        """ Fetch historical OHLCV data for a fixed lookback window (live mode) 
            or a specified start date (backtesting mode). 

            Args:
                start: starting date of price query formatted as 'YYYY-MM-DD'

            Returns:
                A Dataframe indexed by DatetimeIndex with BAR_COLUMNS in configs.
        """

    @abc.abstractmethod
    def get_last_price(self) -> float:
        """ Fetch latest trading/close price of the configured symbol.
        """
    
    @abc.abstractmethod
    def get_position(self) -> Optional[Position]:
        """ Current open position of the configured symbol, or None if flat.
        """
    
    @abc.abstractmethod
    def get_cash(self) -> float:
        """ Cash available for trading in the account currency. 
        """
    
    @abc.abstractmethod
    def submit_limit_order(self, side: OrderSide, qty: int, limit_price: float) -> Optional[str]:
        """ Place a single limit order. Returns a broker order id or None on failure.
        """
    
    @abc.abstractmethod
    def get_order_status(self, order_id: str) -> OrderResult:
        """ Retrieve the status of an order.
        """

    @abc.abstractmethod
    def cancel_order(self, order_id: str):
        """ Cancel an active order. No-op if already inactive.
        """
    
    def execute(self, side: OrderSide, qty: int, ref_price: float) -> OrderResult:
        """ Sumbit a buffered limit order and wait for it to fill or cancel on timeout.

        Args:
            side: direction of transaction
            qty: number of shares rounded by lot size
            ref_price: reference price the limit is offset from
        
        Returns:
            An OrderResult; check '.filled' to know whether the trade went through.
        """
        limit_price = self._apply_slippage(ref_price, side)
        order_id = self.submit_limit_order(side, qty, limit_price)
        if order_id is None:
            return OrderResult(order_id=None, state=OrderState.REJECTED)
        log.info(f"{side} order placed: {qty} @ {limit_price}, id = {order_id}")
        return self._wait_for_fill(order_id)
        

    def _apply_slippage(self, ref_price: float, side: OrderSide) -> float:
        """ Overpay (buy) or underbid (sell) by the configured buffer so the order fills. 
        """
        buf = self.risk.limit_buffer_bps / 10_000
        factor = (1 + buf) if side == "BUY" else (1 - buf)
        return round(ref_price * factor, 3)

    def _wait_for_fill(self, order_id: str) -> OrderResult:
        """ Query order status until it reaches a terminal state or times out.
        """
        start = time.time()
        while time.time() - start < self.risk.max_wait_sec:
            res = self.get_order_status(order_id)
            if res.state in (OrderState.FILLED, OrderState.CANCELLED, OrderState.REJECTED):
                if res.filled:
                    log.info(f"Order {order_id} FILLED (avg={res.avg_filled_price})")
                else:
                    log.warning(f"Order {order_id} ended {res.state}")
                return res
            time.sleep(3)
        
        log.warning(f"Order {order_id} not filled within {self.risk.max_wait_sec}s -- cancelling")
        self.cancel_order(order_id)
        return OrderResult(order_id=order_id, state=OrderState.CANCELLED)

# ================================= Tiger Adapter =====================================
# Guard against SDK imports so it runs even when it's not installed
try:
    from tigeropen.common.consts import (
        BarPeriod, QuoteRight,
        SecurityType, OrderStatus
    )
    from tigeropen.quote.quote_client import QuoteClient
    from tigeropen.trade.trade_client import TradeClient
    from tigeropen.common.util.contract_utils import stock_contract
    from tigeropen.common.util.order_utils import limit_order
    from tigeropen.tiger_open_config import TigerOpenClientConfig
    _TIGER_AVAILABLE = True
except:
    _TIGER_AVAILABLE = False

class TigerAdapter(BrokerAdapter):
    """ Adapter for Tiger Trade via the tigeropen SDK.
    """
    def __init__(self, settings: AppSettings):
        super().__init__(settings)
        if not _TIGER_AVAILABLE:
            raise RuntimeError("Tigeropen is not installed. Tiger Adapter unavailable.")
        
        self.account = settings.broker.tiger_account
        self.quote: Optional[QuoteClient] = None
        self.trade: Optional[TradeClient] = None
        self.contract = None
    
    def _build_config(self) -> TigerOpenClientConfig:
        if self.broker.props_path:
            cfg = TigerOpenClientConfig(props_path=self.broker.props_path)
        else:
            cfg = TigerOpenClientConfig()
            cfg.private_key = self.broker.private_key
            cfg.tiger_id = self.broker.tiger_id
            cfg.tiger_account = self.account
        cfg.timezone = self.broker.tz
        return cfg
    
    def connect(self):
        cfg = self._build_config()
        self.quote = QuoteClient(cfg)
        self.trade = TradeClient(cfg)
        self.contract = stock_contract(symbol=self.symbol, currency=self.currency)
        log.info("Tiger adapter connected.")

    def get_lot_size(self) -> int:
        """Fetch actual lot size from exchange metadata.
        """
        try:
            meta = self.quote.get_trade_metas([self.symbol])
            ls = meta["lot_size"].iloc[0]
            log.info(f"Verified lot size for {self.symbol}: {ls}")
            return ls.item()
        except Exception as e:
            ls = self.broker.lot_size
            log.warning(f"{e}. Could not verify lot size. Using default size of {ls}")
            return ls.item()
    
    def get_bars(self, start=None) -> pd.DataFrame:
        if start:
            bars = self.quote.get_bars(
                symbols=[self.symbol], period=BarPeriod.DAY, right=QuoteRight.BR,
                begin_time=start, end_time=datetime.today().strftime('%Y-%m-%d'),
            )
        else:
            bars = self.quote.get_bars(
                symbols=[self.symbol], period=BarPeriod.DAY, right=QuoteRight.BR,
                limit=self.risk.lookback_bars,
            )
        if bars is None or bars.empty:
            raise RuntimeError("Failed to fetch bar data from Tiger.")
        return self._normalize_bars(bars)
    
    @staticmethod
    def _normalize_bars(bars: pd.DataFrame) -> pd.DataFrame:
        """ Convert raw price bars generated by get_bars to a format that the abstract 
            interface expects.
        """
        df = bars.copy()
        df["time"] = pd.to_datetime(df["time"], unit="ms")
        df = df.set_index("time").sort_index()
        return df[BAR_COLUMNS]

    def get_last_price(self) -> float:
        brief = self.quote.get_stock_briefs([self.symbol])
        return brief['close'].iloc[0]
    
    def get_position(self) -> Optional[Position]:
        try:
            data = self.trade.get_positions(account=self.account, sec_type=SecurityType.STK,
                                            symbol=self.symbol)
            if data:
                row = data[0]
                pos = Position(self.symbol, int(row.quantity), float(row.average_cost))
                log.info(f"Syncd position: {pos.quantity} @ {pos.average_cost:.3f}")
                return pos
            log.info(f"No existing position in {self.symbol}")
            return None
        except Exception as e:
            log.warning(f"Couldn't sync position: {e}")
            return None
    
    def get_cash(self) -> float:
        try:
            data = self.trade.get_prime_assets(account=self.account)
            cash = data.segments['S'].currency_assets.get(self.currency).cash_available_for_trade
            if cash <= 0:
                log.warning(f"No {self.currency} cash available for {self.symbol}")
                return 0.0
            return float(cash)
        except Exception as e:
            log.warning(f"Couldn't fetch balance: {e}")
            return 0.0 
    
    def submit_limit_order(self, side, qty, limit_price) -> Optional[str]:
        order = limit_order(account=self.account, contract=self.contract,
                            action=side, limit_price=limit_price, quantity=qty)
        try:
            self.trade.place_order(order)
            log.info(f"{side} order placed: {qty} at {limit_price}, order_id={order.id}")
            return str(order.id)
        except Exception as e:
            log.error(f"Failed to place {side} order: {e}")
            return None
    
    def get_order_status(self, order_id) -> OrderResult:
        try:
            order = self.trade.get_order(id=int(order_id))
        except Exception as e:
            log.warning(f"Error checking order {order_id}: {e}")
            return OrderResult(order_id, OrderState.UNKNOWN)
        status = getattr(order, "status", None)
        if status in (OrderStatus.FILLED, "Filled", "FILLED"):
            return OrderResult(order_id, OrderState.FILLED,
                               filled_qty=int(getattr(order, "filled", 0) or 0),
                               avg_filled_price=float(getattr(order, "avg_filled_price", 0) or 0))
        elif status in (OrderStatus.CANCELLED, "Cancelled", "CANCELLED"):
            return OrderResult(order_id, OrderState.CANCELLED)
        elif status in (OrderStatus.REJECTED, "Rejected", "REJECTED"):
            return OrderResult(order_id, OrderState.REJECTED)
        else:
            return OrderResult(order_id, OrderState.PENDING)
    
    def cancel_order(self, order_id):
        try:
            self.trade.cancel_order(id=int(order_id))
        except Exception as e:
            log.error(f"Failed to cancel order {order_id}: {e}")       

# ================================= A Cache Decorator =====================================
class CachedBrokerAdapter:
    def __init__(self, inner: BrokerAdapter, settings: AppSettings):
        self._inner = inner
        try:
            self._cache = PriceCache(settings)
        except Exception as e:
            log.warning(f"DB cache init failed {e} -- running without cache.")
            self._cache = None

    def get_bars(self, start=None) -> pd.DataFrame:
        end_ts = pd.Timestamp.now().normalize()
        
        # Backtest mode
        if start:
            start_ts = pd.Timestamp(start)
        else:
            cal_days = int(self.risk.lookback_bars * self.risk.calender_days / self.risk.trading_days) + 30
            start_ts = end_ts - pd.DateOffset(days=cal_days)
        
        # Stage 1: local cache
        cached = pd.DataFrame()
        if self._cache is not None:
            try:
                cached = self._cache.load_bars(start_ts, end_ts, self.broker.interval)
            except Exception as e:
                log.warning(f"DB read failed: {e} -- skipping cache. ")
        
        # Full hit
        if not cached.empty:
            if cached.index[-1] >= end_ts - pd.Timedelta(days=1):
                log.info(f"Cache hit: {len(cached)} bars from DB for {self.symbol}")
                return cached
            # Partial hit
            fetch_start = cached.index[-1] + pd.Timedelta(days=1)
            log.info(f"Partial cache hit: fetching gap {fetch_start.date()} -> {end_ts.date()} from broker.")
        else:
            fetch_start = start_ts
            log.info(f"Cache miss: fetching {start_ts.date()} -> {end_ts.date()} from broker.")

        # Stage 2: fetch missing range from the inner adapter
        api_bars = self._inner.get_bars(
            start=fetch_start.strftime("%Y-%m-%d")
        )

        # Stage 3: persist new bars
        if self._cache is not None:
            try:
                self._cache.insert_bars(api_bars, self.broker.interval)
            except Exception as e:
                log.warning(f"DB write failed: {e} -- continuing without caching result.")
        
        # Stage 4: merge
        if not cached.empty:
            combined = pd.concat([cached, api_bars])
            return combined[~combined.index.duplicated(keep="last")].sort_index()
        return api_bars
    
    # --- all other methods delegate straight through ---
    def connect(self)                              : self._inner.connect()
    def get_lot_size(self)                         : return self._inner.get_lot_size()
    def get_last_price(self)                       : return self._inner.get_last_price()
    def get_position(self)                         : return self._inner.get_position()
    def get_cash(self)                             : return self._inner.get_cash()
    def submit_limit_order(self, s, q, p)          : return self._inner.submit_limit_order(s, q, p)
    def get_order_status(self, oid)                : return self._inner.get_order_status(oid)
    def cancel_order(self, oid)                    : return self._inner.cancel_order(oid)

# ================================ Factory ==========================================
BROKER_REGISTRY = {
    "tiger": TigerAdapter,
    # Add another broker by implementing an adapter and register it here
}

def build_broker(settings: AppSettings) -> BrokerAdapter:
    name = settings.broker.name.lower()
    try:
        cls = BROKER_REGISTRY[name]
    except KeyError:
        raise ValueError(f"Unknown broker: '{name}'. Known brokers: {list(BROKER_REGISTRY)} ")
    
    broker = cls(settings)
    if settings.db.enabled and name != "csv":
        log.info(f"DB cache enabled - wrapping {cls.__name__} with CacheBrokerAdapter.")
        return CachedBrokerAdapter(broker, settings)
    return broker