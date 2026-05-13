"""
Backtesting momentum strategy defined in main script.
"""

import logging
import pandas as pd
from main import TigerClients, TechAnalyst

from utils import *
from settings import BacktestRisk, BacktestState, Trade, load_settings

def run_backtest(df: pd.DataFrame, lot_size) -> BacktestState:
    """Event-driven backtest loop that iterates bar-by-bar. Execute trades based on trading signal 
        of each day.
    """
    # State management of current iteration 
    risk = BacktestRisk
    state = BacktestState(cash = risk.initial_capital)

    # Extract column values for faster iteration
    closes = df['close'].values
    signals = df['signal'].values
    timestamps = df.index.values

    # TODO: why not shift rows by one to avoid forward trading?
    for i in range(len(df)):
        price = closes[i]
        sig = signals[i]
        ts = timestamps[i]
        
        # Check trailing stop 
        if state.position > 0:
            state.highest_since_entry = max(state.highest_since_entry, price)
            stop_price = state.highest_since_entry * (1 - risk.stop_loss_pct)
            if price <= stop_price:
                sig = -1    # Force liquidation 
        
        # Handle sell signal
        if sig == -1 and state.position > 0:
            sell_price = apply_slippage(risk.slippage_bps, price, "SELL")
            proceeds = sell_price * state.position
            comm = calc_commission(risk, sell_price, state.position)
            state.cash += proceeds - comm

            # Log trade details
            if state.current_trade:
                t = state.current_trade
                t.exit_date = ts
                t.exit_price = sell_price
                t.pnl = (sell_price - t.entry_price) * t.quantity - comm - calc_commission(risk, t.entry_price, t.quantity)
                # TODO: probably over optimistic since denominator doesn't contain fee
                t.pnl_pct = t.pnl / (t.entry_price * t.quantity)
                
                if price <= state.highest_since_entry * (1 - risk.stop_loss_pct):
                    t.exit_reason = "trail_stop"
                else:
                    t.exit_reason = "signal"
                
                state.trades.append(t)
                state.current_trade = None
            state.position = 0
            state.entry_price = 0.0
            state.highest_since_entry = 0.0

        elif sig == 1 and state.position == 0:
            equity = state.cash
            budget = equity * risk.trade_size_pct
            buy_price = apply_slippage(risk.slippage_bps, price, "BUY")
            raw_qty = int(budget / buy_price)
            qty = round_to_lot(lot_size, raw_qty)
            if qty <= 0:
                state.equity_curve.append((ts, state.cash))
                continue

            state.cash -= buy_price * qty + calc_commission(risk, buy_price, qty)
            state.position = qty
            state.entry_price = buy_price
            state.highest_since_entry = buy_price
            state.current_trade = Trade(entry_date=ts, entry_price=buy_price, quantity=qty)
        
        # Record equity
        mark_to_market = state.cash + state.position * price
        state.equity_curve.append((ts, mark_to_market))
    
    # Close any open position on the last day
    if state.position > 0:
        last_price = df.iloc[-1]["close"]
        sell_price = apply_slippage(risk.slippage_bps, last_price, "SELL")
        comm = calc_commission(risk, sell_price, state.position)
        state.cash += sell_price * state.position - comm
        if state.current_trade:
            t = state.current_trade
            t.exit_date = df.index[-1]
            t.exit_price = sell_price
            t.pnl = (sell_price - t.entry_price) * t.quantity - comm - calc_commission(risk, t.entry_price, t.quantity)
            t.pnl_pct = t.pnl / (t.entry_price * t.quantity)
            t.exit_reason = "end_of_data"
            state.trades.append(t)
        state.position = 0
    return state


if __name__ == "__main__":
    settings = load_settings()

    # Load global settings from root logger
    setup_logging(settings.logging.file, settings.logging.level)
    log = logging.getLogger(__name__)   # Initialize a named logger 

    client = TigerClients()
    analyst = TechAnalyst(client)
    test_duration = 3   # Number of years of historical price data
    lot_size = client.verify_lot_size()

    # Fetch data 
    log.info(f"Fetching historical bars for {settings.broker.symbol}")
    bars = analyst.fetch_bars(test=True, test_duration=test_duration)

    # Compute custom start and end time
    end = pd.Timestamp.now().normalize()
    start = end - pd.DateOffset(years=test_duration)
    log.info(f"{'=' * 50}")
    log.info(f"Start date: {start.strftime('%Y-%m-%d')} | End date: {end.strftime('%Y-%m-%d')}")
    
    # Compute indicators and signals
    bars = analyst.compute_indicators(bars)
    bars = analyst.get_all_signals(bars)
    log.info("Overview: signal counts -- BUY: %d | SELL: %d",
            (bars["signal"] == 1).sum(), 
            (bars["signal"] == -1).sum())
    log.info(f"\n{bars[bars['signal'] == 1]}\n{bars[bars['signal'] == -1]}")

    # Run backtest
    log.info(f"Running backtest (capital={BacktestRisk.initial_capital:,} HKD)")
    result = run_backtest(bars, lot_size)
