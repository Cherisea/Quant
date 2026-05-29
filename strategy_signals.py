

import pandas as pd
from configs import StrategySettings

# Unified int signal code used internally
HOLD, BUY, SELL = 0, 1, -1
_SIGNAL_LABELS = {0: "HOLD", 1: "BUY", -1: "SELL"}


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

    signals = pd.Series(0, index=df.index, dtype="int8")
    signals.loc[cross_up & (roc | vol)] = 1

    # TODO: is a cross-down signal sufficient for a sell signal
    signals.loc[cross_down] = -1
    return signals

def get_lastest_signal(df: pd.DataFrame, strategy: StrategySettings) -> int:
    """ Retrieve the last trading signal from a series of signals.
    """
    if len(df) < 2:
        return 0
    
    return compute_signals(df, strategy).iloc[-1]

def convert_code_to_label(code: int) -> str:
    """ Map numeric code of trading signal to a human-readable label.

    Args:
        code: signal code with values from [0, -1, 1].

    Returns:
        a trading label of either BUY, SELL or HOLD. Defaults to HOLD if 
        code if not valid.
    """
    return _SIGNAL_LABELS.get(code, "HOLD")


