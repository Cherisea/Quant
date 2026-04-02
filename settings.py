"""
    Grouped settings for main script.
"""
import os
from typing import Optional
from dotenv import load_dotenv
from dataclasses import dataclass

# Load env vars from .env file 
load_dotenv()

@dataclass(frozen=True)
class BrokerSettings:
    props_path: Optional[str]
    private_key: Optional[str]
    tiger_id: Optional[str]
    tiger_account: Optional[str]
    symbol: str = "06066"
    currency: str = "HKD"
    lot_size: int = 500
    tz: str = "Asia/Hong_Kong"

@dataclass(frozen=True)
class RiskSettings:
    trade_size_pct: float = 0.15        # Fraction of available fund allocated for each trade
    stop_loss_pct: float = 0.05         # 5% Trailing stop
    limit_buffer_bps: int = 10          # Overpay amount in base point for an order to be filled
    max_wait_sec: int = 60              # Max amount of time to wait before canceling an order
    lookback_bars: int = 240            # Number of daily bars to fetch at each tick

@dataclass(frozen=True)
class StrategySettings:
    fast_ema: int = 20
    slow_ema: int = 60
    vol_ma: int =  20   # Rolling window for calculating average daily volume
    vol_coefficient: float = 1.5    # Min volume to initiate a trade
    roc_period: int = 14    # Rate of change lookback window
    roc_threshold: float = 0.03      # Min price ROC required to initiate a trade

@dataclass(frozen=True)
class ScheduleSettings:
    check_interval_min: int = 5
    market_open: str = "09:30"
    market_close: str = "16:00"
    lunch_start: str = "12:00"
    lunch_end: str = "13:00"

@dataclass(frozen=True)
class LoggingSettings:
    file: str = "./logs/trading_bot_06066.log"
    level: str = "INFO"

# Setting orchestrator
@dataclass(frozen=True)
class AppSettings:
    broker: BrokerSettings
    risk: RiskSettings
    strategy: StrategySettings
    schedule: ScheduleSettings
    logging: LoggingSettings

def load_settings() -> AppSettings:
    broker = BrokerSettings(
        props_path = os.getenv("PROPS_PATH"),
        private_key = os.getenv("PRIVATE_KEY"),
        tiger_id = os.getenv("TIGER_ID"),
        tiger_account = os.getenv("TIGER_ACCOUNT")
    )
    risk = RiskSettings()
    strategy = StrategySettings()
    schedule = ScheduleSettings()
    logging = LoggingSettings()

    _validate_settings(broker, risk, strategy)
    return AppSettings(
        broker=broker,
        risk = risk,
        strategy = strategy,
        schedule = schedule,
        logging = logging
    )

def _validate_settings(broker: BrokerSettings, risk: RiskSettings, strategy: StrategySettings):
    if strategy.fast_ema >= strategy.slow_ema:
        raise ValueError("Fast EMA must be less than slow EMA.")
    if not (0 < risk.trade_size_pct < 1):
        raise ValueError("Trade_size_pct must be a float between 0 and 1.")
    if broker.props_path is None and (not broker.private_key or not broker.tiger_id or not broker.tiger_account):
        raise ValueError("Missing broker credentials: set PROPS_PATH or PRIVATE_KEY/TIGER_ID/TIGER_ACCOUNT.")
