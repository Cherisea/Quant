"""
Backtesting momentum strategy defined in main script.
"""

import math
import logging
from time import strftime
import pandas as pd
from pandas import DataFrame
from main import TigerClients, TechAnalyst

from settings import BacktestRisk, BacktestState, load_settings
from utils import setup_logging

settings = load_settings()

# Load global settings from root logger
setup_logging(settings.logging.file, settings.logging.level)
log = logging.getLogger(__name__)   # Initialize a named logger 

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
    return price + offset if side == "BUY" else price - offset

def calc_commission(price: float, qty: int) -> float:
    """Calculate al HK trading costs per HKEX fee schedule.

    """
    turnover = price * qty
    brokerage = turnover * BacktestRisk.commission_rate
    stamp = math.ceil(turnover * BacktestRisk.stamp_duty)

    sfc = round(turnover * BacktestRisk.sfc_levy, 2)
    trading_fee = round(turnover * BacktestRisk.trading_fee, 2)
    afrc = round(turnover * BacktestRisk.afrc_levy, 2)
    return brokerage + stamp + sfc + trading_fee + afrc

def run_backtest(df: pd.DataFrame) -> BacktestState:
    """Event-driven backtest loop that iterates bar-by-bar. Execute trades based on trading signal 
        of each day.
    """
    # State management of current iteration 
    state = BacktestState(cash = BacktestRisk.initial_capital)

    pass


if __name__ == "__main__":
    client = TigerClients()
    analyst = TechAnalyst(client)
    test_duration = 3   # Number of years of historical price data

    # Fetch data 
    log.info(f"Fetching historical bars for {settings.broker.symbol}")
    bars = analyst.fetch_bars(test=True, test_duration=test_duration)

    end = pd.Timestamp.now().normalize()
    start = end - pd.DateOffset(years=test_duration)
    log.info(f"{'=' * 50}")
    log.info(f"Start date: {start.strftime('%Y-%m-%d')} | End date: {end.strftime('%Y-%m-%d')}")
    
    # Compute indicators and signals
    bars = analyst.compute_indicators(bars)
    bars = analyst.get_all_signals(bars)
    log.info("Signal counts -- BUY: %d | SELL: %d",
            (bars["signal"] == 1).sum(), 
            (bars["signal"] == -1).sum())
