"""
    Broker abstraction layer that adopts a factory pattern. Defines a single interface the trading 
    engine codes against, so trading strategy never depends on a specific broker's SDK.
"""

import abc
import logging
import time
import pandas as pd

from typing import Optional
from configs import AppSettings, Position, OrderResult, OrderSide, OrderState, LoggingSettings

LoggingSettings()
log = logging.getLogger(__name__)   # Initialize a named logger 

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
    def get_bars(self, lookback: Optional[int] = None, start: Optional[str] = None, 
                 end: Optional[str] = None) -> pd.DataFrame:
        """ Fetch historical OHLCV data for a fixed lookback window (live mode) 
            or a specified date range (backtesting mode). 

            Args:
                lookback: how far back to pull historical price bars, measured in days
                start: starting date of price query formatted as 'YYYY-MM-DD'
                end: end date of price query formatted as 'YYYY-MM-DD'

            Returns:
                A Dataframe indexed by DatetimeIndex with BAR_COLUMNS in configs.
        """

    @abc.abstractmethod
    def get_last_price(self):
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
            cfg.tiger_account = self.broker.tiger_account
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
    
    def get_bars(self, lookback=None, start=None, end=None) -> pd.DataFrame:
        if start and end:
            bars = self.quote.get_bars(
                symbols=[self.symbol], period=BarPeriod.DAY, right=QuoteRight.BR,
                begin_time=start, end_time=end,
            )
        else:
            bars = self.quote.get_bars(
                symbols=[self.symbol], period=BarPeriod.DAY, right=QuoteRight.BR,
                limit=lookback or self.risk.lookback_bars,
            )
        if bars is None or bars.empty:
            raise RuntimeError("Failed to fetch bar data from Tiger.")
        return self._normalize_bars(bars)