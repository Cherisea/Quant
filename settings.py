"""
    Grouped settings for main script.
"""
import os
import pandas as pd
from typing import Optional
from dotenv import load_dotenv
from dataclasses import dataclass, field

# Load env vars from .env file 
load_dotenv()

@dataclass(frozen=True)
class BacktestRisk:
    """Risk settings for backtesting momentum strategy.
    """
    initial_capital: int = 500_000.0     # HKD
    trade_size_pct: float = 0.2       # Fraction of available fund for a single trade
    stop_loss_pct: float = 0.05     # 5% trailing stop orders
    commission_rate: float = 0.0003     # 3 bps fee charged per side
    stamp_duty: float = 0.001      # HK stamp duty per side
    sfc_levy: float = 0.000027      # HK SFC levy
    trading_fee: float = 0.0000565      # HKEX trading fee 0.00565% per side
    afrc_levy: float = 0.0000015        # AFRC transaction levy 0.00015% per side
    slippage_bps: int = 5               # 5 bps assumed slippage

@dataclass
class Trade:
    entry_date: pd.Timestamp
    entry_price: float
    quantity: int
    exit_date: Optional[pd.Timestamp] = None
    exit_price: Optional[float] = None

    pnl: float = 0.0    # Profit and loss in absolute amount
    pnl_pct: float = 0.0    # Profit and loss as a percentage
    exit_reason: str = ""

@dataclass
class BacktestState:
    cash: float
    # Custom attribute with a mutable default value
    equity_curve: list = field(default_factory=list)
    position: int = 0
    entry_price: float = 0.0
    highest_since_entry: float = 0.0
    trades: list = field(default_factory=list)      # Complete trade log
    current_trade: Optional[Trade] = None

@dataclass(frozen=True)
class BrokerSettings:
    """Broker can be connected either with a properties file or required environment
        variables.
    """
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
    """Configures asset allocation for each trade, strategy for avoiding slippage and 
        number of candelstick bars to examine.
    """
    trade_size_pct: float = 0.2        # Fraction of available fund allocated for each trade
    stop_loss_pct: float = 0.05         # 5% Trailing stop
    limit_buffer_bps: int = 10          # Overpay amount in base point for an order to be filled
    max_wait_sec: int = 60              # Max amount of time to wait before canceling an order
    lookback_bars: int = 240            # Number of daily bars to fetch at each tick

@dataclass(frozen=True)
class StrategySettings:
    """Configures a duel EMA crossover strategy with two confirmation filters: a 14-day 
        period rate of change(roc) and an elevated volume compared to 20-day moving 
        average.
    """
    fast_ema: int = 20
    slow_ema: int = 60
    vol_ma: int =  20   # Rolling window for calculating average daily volume
    vol_coefficient: float = 1.5    # Min volume to initiate a trade
    roc_period: int = 14    # Rate of change lookback window
    roc_threshold: float = 0.03      # Min price ROC required to initiate a trade

@dataclass(frozen=True)
class ScheduleSettings:
    """Configures trading bot running schedule and specifies trading hours of HKSE.
    """
    tick_interval: int = 10     # Interval between two evaluation cycle
    market_open: str = "09:30"
    market_close: str = "16:00"
    lunch_start: str = "12:00"
    lunch_end: str = "13:00"

@dataclass(frozen=True)
class LoggingSettings:
    """Specifies where logs should be kept and what types of message should be captured.
    """
    file: str = "./logs/trading_bot_06066.log"
    level: str = "INFO"

# Setting orchestrator
@dataclass(frozen=True)
class AppSettings:
    """An parent class that encompasses all kinds of settings.
    """
    broker: BrokerSettings
    risk: RiskSettings
    strategy: StrategySettings
    schedule: ScheduleSettings
    logging: LoggingSettings

def load_settings() -> AppSettings:
    """Populates values of fields in Broker and initialize other settings.
    """
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
    """Verify values of various settings are valid.
    """
    if strategy.fast_ema >= strategy.slow_ema:
        raise ValueError("Fast EMA must be less than slow EMA.")
    if not (0 < risk.trade_size_pct < 1):
        raise ValueError("Trade_size_pct must be a float between 0 and 1.")
    if broker.props_path is None and (not broker.private_key or not broker.tiger_id or not broker.tiger_account):
        raise ValueError("Missing broker credentials: set PROPS_PATH or PRIVATE_KEY/TIGER_ID/TIGER_ACCOUNT.")
