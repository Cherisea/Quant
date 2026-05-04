"""
Momentum Backtest Engine
"""

import pandas as pd
from pandas import DataFrame
from main import TigerClients, TechAnalyst


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