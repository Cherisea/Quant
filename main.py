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
        self.lot_size = self.verify_lot_size()

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
            limit = self.client.lookback_bars
        )

        if bars is None or bars.empty:
            raise RuntimeError("Failed to fetch bar data.") 
        
        # Preprocess fetched data
        bars["time"] = pd.to_datetime(bars["time"], unit="ms")
        bars.set_index("time", inplace=True)
        bars.sort_index(inplace=True, ascending=False)
        return bars

client = TigerClients()
analyst = TechAnalyst(client)
print(analyst.get_bars())