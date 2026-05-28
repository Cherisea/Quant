

import pandas as pd
from configs import StrategySettings

# Unified int signal code used internally
HOLD, BUY, SELL = 0, 1, -1

def compute_signals(df: pd.DataFrame, strategy: StrategySettings) -> pd.Series:
    """ Vectorized EMA crossover signals for every row, complemented by a rate of change
        threshold or elevated volume. 

        Required columes: fast_ema, slow_ema, roc, volume, vol_ma. 
        (i.e. output of TechAnalyst.compute_indicators).

    Args: 
        df: a dataframe containing required columns for deriving momentum signals
        strategy: a data class defining roc and volume parameters

    Returns:
        series of int: 1 for buy, -1 for sell and 0 for hold. Index matches df. 
    """
    required = {"fast_ema", "slow_ema", "roc", "volume", "vol_ma"}
    missing = required - set(df.columns)
    if missing:
        raise ValueError(f"Missing columns in input dataframe: {sorted(missing)}")

    # Golden cross: fast_ema crosses above slow_ema
    cross_up = (
        (df["fast_ema"] > df["slow_ema"]) &
        (df["fast_ema"].shift(1) <= df["slow_ema"].shift(1))
    )

    # Death cross: fast_ema dips below slow_ema
    cross_down = (
        (df["fast_ema"] < df["slow_ema"]) &
        (df["fast_ema"].shift(1) >= df["slow_ema"].shift(1))
    )

    roc = df["roc"] > strategy.roc_threshold
    vol = df["volume"] > strategy.vol_coefficient * df["vol_ma"]

    signals = pd.Series(HOLD, index=df.index, dtype="int8")
    signals.loc[cross_up & (roc | vol)] = BUY

    # TODO: is a cross-down signal sufficient for a sell signal
    signals.loc[cross_down] = SELL
    return signals