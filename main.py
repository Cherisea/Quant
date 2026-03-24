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
from tigeropen.tiger_open_config import TigerOpenClientConfig

# Load env vars from .env file 
load_dotenv()

# Configuration
CODE = "06066"  # CSC in HKSE
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
LOG_FILE = "trading_bot_06066.log"
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE),
        logging.StreamHandler(sys.stdout)
    ],
)
log = logging.getLogger(__name__)


