"""
    Broker abstraction layer that adopts a factory pattern. Defines a single interface the trading 
    engine codes against, so trading strategy never depends on a specific broker's SDK.
"""

import abc
import pandas as pd
from typing import Optional
from configs import AppSettings, Position, OrderResult


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

            Returns a Dataframe indexed by DatetimeIndex with BAR_COLUMNS in configs.
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
    def submit_limit_order(self, side: str, qty: int, limit_price: float) -> Optional[str]:
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
    
    def execute(self, side: str, qty: int, ref_price: float) -> OrderResult:
        """ 
        
        """