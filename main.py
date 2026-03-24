"""
A trading bot that operates on simple momentum strategy.
"""

# System and third-party imports
import os 
import sys
import logging
from dotenv import load_dotenv

# Tiger trade imports
from tigeropen.common.consts import (
    Language, Market, BarPeriod, QuoteRight,
    SecurityType, Currency, OrderStatus
)
from tigeropen.quote.quote_client import QuoteClient
from tigeropen.trade.trade_client import TradeClient
from tigeropen.common.util.contract_utils import stock_contract
from tigeropen.tiger_open_config import PRIVATE_KEY, TigerOpenClientConfig

# Load env vars from .env file 
load_dotenv()

# Tiger trade credentials
PROPS_PATH = os.getenv("PROPS_PATH")

# Configuration
SYMBOL = "06066"  # CSC in HKSE
CURRENCY = "HKD"
LOT_SIZE = 500

# Momentum strategy parameters
FAST_EMA = 20
SLOW_EMA = 60
VOL_MA = 20     # Rolling window for calculating average daily volume
VOL_COEFFICIENT = 1.5   # Min volume to initiate a trade
ROC_PERIOD = 14     # Rate of change lookback window
ROC_THRESHOLD = 0.03    # Min price ROC required to initiate a trade

# Risk / execution
TRADE_SIZE_PCT = 0.15   # Fraction of available fund allocated for each trade
STOP_LOSS_PCT = 0.05    # 5% Trailing stop
LIMIT_BUFFER_BPS = 10   # Overpay amount for an order to be filled
MAX_WAIT_SEC = 60       # Max amount of time to wait before canceling an order
LOOKBACK_BARS = 240     # Number of daily bars to fetch at each tick

# Scheduling
CHECK_INTERVAL_MIN = 5  # Re-evaluate every 5 minutes during market hours
HK_MARKET_OPEN = "09:30"
HK_MARKET_CLOSE = "16:00"
HK_LUNCH_START = "12:00"
HK_LUNCH_END = "13:00"

# Logging
LOG_FILE = "./logs/trading_bot_06066.log"
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ],
)
log = logging.getLogger(__name__)

class TigerClient:
    """A holder for quote and trade agent.
    """
    def __init__(self) -> None:
        self.cfg = self._build_config()
        self.quote = QuoteClient(self.cfg)
        self.trade = TradeClient(self.cfg)
        self.contract = stock_contract(symbol=SYMBOL, currency=CURRENCY)    # Security to trade
        log.info(f"Tiger client initialized.")
    
    @staticmethod
    def _build_config():
        """Configure tiger client by retrieving information from env vars.
        """
        if PROPS_PATH:
            cfg = TigerOpenClientConfig(props_path=PROPS_PATH)
        else:
            cfg = TigerOpenClientConfig()
            cfg.private_key = os.getenv("PRIVATE_KEY", "Non-exist")
            cfg.tiger_id = os.getenv("TIGER_ID", "Non-Exist")
            cfg.tiger_account = os.getenv("ACCOUNT", "Non-Exist")
        cfg.language = Language.en_US
        cfg.timezone = "Asia/Hong_Kong"
        return cfg

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