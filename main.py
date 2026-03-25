"""
A trading bot that operates on simple momentum strategy.
"""

# System and third-party imports
import os 
import sys
import logging
from settings import load_settings

# Tiger trade imports
from tigeropen.common.consts import (
    Language, Market, BarPeriod, QuoteRight,
    SecurityType, Currency, OrderStatus
)
from tigeropen.quote.quote_client import QuoteClient
from tigeropen.trade.trade_client import TradeClient
from tigeropen.common.util.contract_utils import stock_contract

settings = load_settings()
SYMBOL = settings.broker.symbol
CURRENCY = settings.broker.currency
LOT_SIZE = settings.broker.lot_size

logging.basicConfig(
    level = settings.logging.level,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(settings.logging.file),
        logging.StreamHandler(sys.stdout)
    ],
)
log = logging.getLogger(__name__)

class TigerClient:
    """A holder for quote and trade agent.
    """
    def __init__(self) -> None:
        self.cfg = settings
        self.quote = QuoteClient(self.cfg)
        self.trade = TradeClient(self.cfg)
        self.contract = stock_contract(symbol=SYMBOL, currency=CURRENCY)    # Security to trade
        log.info(f"Tiger client initialized.")

    def verify_lot_size(self) -> int:
        """Fetch actual lot size from exchange metadata.
        """
        try:
            meta = self.quote.get_trade_metas([SYMBOL])
            ls = meta["lot_size"].iloc[0]
            log.info(f"Verified lot size for {SYMBOL}: {ls}")
            return ls
        except Exception as e:
            log.warning(f"Could not verify lot size. Using default size of {LOT_SIZE}")
            return LOT_SIZE

client = TigerClient()
client.verify_lot_size()