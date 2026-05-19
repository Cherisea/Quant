"""
Backtesting momentum strategy defined in main script.
"""

import logging
import pandas as pd
from main import TigerClients, TechAnalyst

from utils import *
from configs import BacktestRisk, BacktestState, Trade, TradeFeesHK, load_settings

def fill_trade(trade: Trade, ts: pd.Timestamp, sell_price: float, comm: float, exit_reason: str) -> Trade:
    """Log trade details for review and analysis. 

    Args:
        trade: a data class containing limited trade details
        ts: when current trade is complete
        sell_price: price at which positions exit
        comm: commission fee at sell
        exit_reason: reason to exit positions

    Returns:
        a filled trade object.
    """
    # Only log trade details if it exists
    if not trade: return

    trade.exit_date = ts
    trade.exit_price = sell_price
    trade.trans_fees += comm 
    trade.pnl = (sell_price - trade.entry_price) * trade.quantity - trade.trans_fees
    # TODO: probably over optimistic since denominator doesn't contain fee
    trade.pnl_pct = trade.pnl / (trade.entry_price * trade.quantity)
    trade.exit_reason = exit_reason

    return trade


def run_backtest(df: pd.DataFrame, lot_size) -> BacktestState:
    """Event-driven backtest loop that iterates bar-by-bar. Execute trades based on trading signal 
        of each day.
    """
    # State management of current iteration 
    risk = BacktestRisk
    fees = TradeFeesHK
    state = BacktestState(cash = risk.initial_capital)

    # Extract column values for faster iteration
    closes = df['close'].values
    opens = df['open'].values
    signals = df['signal'].values
    timestamps = df.index.values

    for i in range(1, len(df)):
        exec_price = float(opens[i])        # Execute at today's open
        mark_price = float(closes[i])   # Mark-to-market at today's close
        sig = signals[i-1]      # Trade on yesterday's signal
        ts = pd.Timestamp(timestamps[i]).isoformat(timespec="seconds")
        
        # Check trailing stop 
        if state.position > 0:
            state.highest_since_entry = max(state.highest_since_entry, mark_price)
            stop_price = state.highest_since_entry * (1 - risk.stop_loss_pct)
            if mark_price <= stop_price:
                sig = -1    # Force liquidation 
        
        # Handle sell signal
        if sig == -1 and state.position > 0:
            sell_price = apply_slippage(risk.slippage_bps, exec_price, "SELL")
            proceeds = sell_price * state.position
            comm_sell = calc_commission(fees, sell_price, state.position)
            state.cash += proceeds - comm_sell
            
            # Record trade details
            if sell_price <= state.highest_since_entry * (1 - risk.stop_loss_pct):
                exit_reason = "trail_stop"
            else:
                exit_reason = "signal"
            t = fill_trade(state.current_trade, ts, sell_price, comm_sell, exit_reason)
            state.trades.append(t)
            state.current_trade = None

            state.position = 0
            state.entry_price = 0.0
            state.highest_since_entry = 0.0

        elif sig == 1 and state.position == 0:
            equity = state.cash
            budget = equity * risk.trade_size_pct
            buy_price = apply_slippage(risk.slippage_bps, exec_price, "BUY")
            raw_qty = int(budget / buy_price)
            qty = round_to_lot(lot_size, raw_qty)
            if qty <= 0:
                state.equity_curve.append((ts, state.cash))
                continue
            
            comm_buy = calc_commission(fees, buy_price, qty)
            state.cash -= buy_price * qty + comm_buy
            state.position = qty
            state.entry_price = buy_price
            state.highest_since_entry = buy_price
            state.current_trade = Trade(entry_date=ts, entry_price=buy_price, quantity=qty, trans_fees=comm_buy)
        
        # Record equity
        mark_to_market = state.cash + state.position * mark_price
        state.equity_curve.append((ts, mark_to_market))
    
    # Clear any open positions on the last day
    if state.position > 0:
        last_price = df.iloc[-1]["close"]
        sell_px = apply_slippage(risk.slippage_bps, last_price, "SELL")
        comm = calc_commission(fees, sell_price, state.position)
        state.cash += sell_price * state.position - comm

        t_last = fill_trade(state.current_trade, df.index[-1], sell_px, comm, "end_of_data")
        state.trades.append(t_last)
        state.position = 0
    print(f"All trades: {state.trades}")
    return state


if __name__ == "__main__":
    # =================== Load settings and set up a logger ===================
    settings = load_settings()
    setup_logging(settings.logging.file, settings.logging.level)
    log = logging.getLogger(__name__)   # Initialize a named logger 

    # ================== Boot up trading clients =================
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

    # =================== Run backtest ==================
    log.info(f"Running backtest (capital={BacktestRisk.initial_capital:,} HKD)")
    result = run_backtest(bars, lot_size)
