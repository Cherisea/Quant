"""
Backtesting momentum strategy defined in main script.
"""

import math
import pandas as pd
from pandas import DataFrame
from main import TigerClients, TechAnalyst

from settings import BacktestRisk

def generate_signals(client: TigerClients, df: DataFrame) -> pd.DataFrame:
    """Generate trading signals for all rows of a dataframe.

    Args:
        client: a functional trading client
        df: data of target stocks
    
    Returns:
        A modified dataframe with a new "signal" column.
    """
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

def apply_slippage(price: float, side: str) -> float:
    """Calculate slippage adjusted stock price based on action type. As slippage always works 
        against us, selling prices are adjusted lower, while buying prices higher.

    Args:
        price: expected stock price
        side: a string indicating type of price action

    Returns:
        slippage adjusted price.
    """
    offset = price * BacktestRisk.slippage_bps / 10_000
    return price + offset if side == "buy" else price - offset

def calc_commission(price: float, qty: int, side: str) -> float:
    """Calculate al HK trading costs per HKEX fee schedule.

    """
    turnover = price * qty
    brokerage = turnover * BacktestRisk.commission_rate
    stamp = math.ceil(turnover * BacktestRisk.stamp_duty)

    sfc = round(turnover * BacktestRisk.sfc_levy, 2)
    trading_fee = round(turnover * BacktestRisk.trading_fee, 2)
    afrc = round(turnover * BacktestRisk.afrc_levy, 2)
    return brokerage + stamp + sfc + trading_fee + afrc

client = TigerClients()
analyst = TechAnalyst(client)
bars = analyst.fetch_bars(test=True)
df = analyst.compute_indicators(bars)
generate_signals(client, df)