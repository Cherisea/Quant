"""
Backtesting momentum strategy defined in main script.
"""

import pandas as pd
from pandas import DataFrame
from typing import Optional
from dataclasses import dataclass, field
from main import TigerClients, TechAnalyst

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

def generate_signals(client: TigerClients, df: DataFrame) -> pd.DataFrame:
    df = df.copy()
    df['signal'] = 0

    # Moment of transition where fast and slow ema flips position
    cross_up = (df['fast_ema'] > df['slow_ema']) & (df['fast_ema'].shift(1) <= df['slow_ema'].shift(1))
    cross_down = (df['fast_ema'] < df['slow_ema']) & (df['fast_ema'].shift(1) >= df['slow_ema'].shift(1))

    momentum = df['roc'] > client.roc_threshold
    volume = df['volume'] > client.vol_coefficient * df['vol_ma']

    df.loc[cross_up & momentum & volume, 'signal'] = 1     # Buy signal
    df.loc[cross_down, "signal"] = -1        # Sell signal

    return df

client = TigerClients()
analyst = TechAnalyst(client)
bars = analyst.fetch_bars(test=True)
df = analyst.compute_indicators(bars)
generate_signals(client, df)