"""
Backtesting momentum strategy defined in main script.
"""

import logging
import pandas as pd
import numpy as np
from main import TigerClient, TechAnalyst

from utils import *
from configs import BacktestRisk, BacktestState, Trade, TradeFeesHK, load_settings

# =================== Load settings and set up a logger ===================
settings = load_settings()
setup_logging(settings.logging.file, settings.logging.level)
log = logging.getLogger(__name__)   # Initialize a named logger 

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
    trade.gross_pnl = (sell_price - trade.entry_price) * trade.quantity
    trade.net_pnl = trade.gross_pnl - trade.trans_fees - comm
    trade.pnl_pct = trade.net_pnl / (trade.entry_price * trade.quantity + trade.trans_fees)
    trade.exit_reason = exit_reason
    trade.trans_fees += comm

    return trade

def resolve_signal(risk: BacktestRisk, state: BacktestState, price: float, org_sig: int) -> int:
    """Return trading signal after checking on trailing-stop condition.

    Args:
        risk: a snapshot of backtest risk
        state: a snapshot of backtest status 
        price: today's closing price
        org_sig: original signal

    Returns:
        int: -1 or 1 for sell or buy respetively
    """
    if state.position > 0:
        state.highest_since_entry = max(state.highest_since_entry, price)
        stop_price = state.highest_since_entry * (1 - risk.stop_loss_pct)
        if price <= stop_price:
            org_sig = -1    # Overwrite original signal
    
    return org_sig

def execute_sell(risk: BacktestRisk, state: BacktestState, price: float, ts: pd.Timestamp, fee: TradeFeesHK):
    """Close current position and write trade details into backtest state. No-op if position is empty.

    Args:
        risk: a data class storing risk configuration
        state: a snapshot of backtest state
        price: execution price
        ts: pandas timestamp for logging purposes
        fee: a data class storing HK trading fee structure
    """
    sell_price = apply_slippage(risk.slippage_bps, price, "SELL")
    proceeds = sell_price * state.position
    comm_sell = calc_commission(fee, sell_price, state.position)
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

def execute_buy(risk: BacktestRisk, state: BacktestState, price: float, 
                ts: pd.Timestamp, fee: TradeFeesHK, lot_size: int):
    """Enter position if fund is enough and log trade details in testing state.

    Returns:
        int: 0 if fund is insufficient else 1
    """
    equity = state.cash
    budget = equity * risk.trade_size_pct
    buy_price = apply_slippage(risk.slippage_bps, price, "BUY")
    raw_qty = int(budget / buy_price)
    qty = round_to_lot(lot_size, raw_qty)
    if qty <= 0:
        state.equity_curve.append((ts, state.cash))
        return 0

    comm_buy = calc_commission(fee, buy_price, qty)
    state.cash -= buy_price * qty + comm_buy
    state.position = qty
    state.entry_price = buy_price
    state.highest_since_entry = buy_price
    state.current_trade = Trade(entry_date=ts, entry_price=buy_price, quantity=qty, trans_fees=comm_buy)
    return 1

def liquidate_at_end(risk: BacktestRisk, state: BacktestState, price: float, ts: pd.Timestamp, fee: TradeFeesHK):
    """Close any remaining position at the end of test period and log trade in backtest state.
    """
    sell_px = apply_slippage(risk.slippage_bps, price, "SELL")
    comm = calc_commission(fee, sell_px, state.position)
    state.cash += sell_px * state.position - comm

    t_last = fill_trade(state.current_trade, ts, sell_px, comm, "end_of_data")
    state.trades.append(t_last)
    state.position = 0

def analyse_performance(state: BacktestState, df: pd.DataFrame) -> dict:
    """Calculate various performance metrics based on current backtesting state.

    Args:
        state: current backtesting state
        df: data on target stocks
        
    Returns:
        dict and dataframe: dict of a collection of metrics and their values; a new dataframe.
    """
    eq = pd.DataFrame(state.equity_curve, columns=["date", "equity"]).set_index("date")
    eq["return"] = eq["equity"].pct_change()
    
    total_return = (eq["equity"].iloc[-1] / BacktestRisk.initial_capital) - 1       
    days = (eq.index[-1] - eq.index[0]).days
    ann_return = (1 + total_return) ** (BacktestRisk.days_yearly / max(days, 1)) - 1

    ann_vol = eq["return"].std() * np.sqrt(BacktestRisk.trading_days_yearly)
    sharpe = (ann_return - BacktestRisk.risk_free_rate) / ann_vol if ann_vol > 0 else 0.0

    running_max = eq["equity"].cummax()
    drawdown = (eq["equity"] - running_max) / running_max
    max_dd = drawdown.min()

    trades = state.trades
    n_trades = len(trades)
    winners = [t for t in trades if t.net_pnl > 0]
    win_rate = len(winners) / n_trades if n_trades > 0 else 0

    avg_win_pct = np.mean([t.pnl_pct for t in winners]) if winners else 0
    losers = [t for t in trades if t.net_pnl < 0]
    avg_loss_pct = np.mean([t.pnl_pct for t in losers]) if losers else 0 

    # Amount of money made relative to that lost
    if sum(t.net_pnl for t in losers) != 0:
        profit_factor = sum(t.net_pnl for t in winners) / abs(sum(t.net_pnl for t in losers))
        
    else:
        profit_factor = float('inf')
    
    # Approximate buy and hold return rate 
    bnh_return = (df["close"].iloc[-1] / df["close"].iloc[0]) - 1

    stats = {
        "total_return": f"{total_return:.2%}",
        "annualized_return": f"{ann_return:.2%}",
        "annualized_volatility": f"{ann_vol:.2%}",
        "sharpe_ratio": f"{sharpe:.2}",
        "max_drawdown": f"{max_dd:.2%}",
        "total_trades": n_trades,
        "win_rate": f"{win_rate:.2%}",
        "avg_win_pct": f"{avg_win_pct:.2%}",
        "avg_loss_pct": f"{avg_loss_pct:.2%}",
        "buy_and_hold_return": f"{bnh_return:.2%}"
    }
    stats["profit_factor"] = f"{profit_factor:.2}" if profit_factor != float('inf') else "inf"
    return stats, eq

def run_backtest(df: pd.DataFrame, lot_size) -> BacktestState:
    """Event-driven backtest loop that iterates bar-by-bar. Execute trades based on daily trading signal.
    """
    # State management of current iteration 
    risk = BacktestRisk
    fee = TradeFeesHK
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
        ts = pd.Timestamp(timestamps[i])
        
        # Check trailing stop
        sig = resolve_signal(risk, state, mark_price, sig)
        
        # Handle sell signal
        if sig == -1 and state.position > 0:
            execute_sell(risk, state, exec_price, ts, fee)
        elif sig == 1 and state.position == 0:
            if not execute_buy(risk, state, exec_price, ts, fee, lot_size):
                continue
        
        # Record equity
        mark_to_market = state.cash + state.position * mark_price
        state.equity_curve.append((ts, mark_to_market))
    
    # Clear any open positions on the last day
    if state.position > 0:
        liquidate_at_end(risk, state, df['close'].iloc[-1], df.index[-1], fee)
    return state

if __name__ == "__main__":
    # Step 1: Boot up trading clients
    client = TigerClient(settings)
    analyst = TechAnalyst(client, settings)
    test_duration = 3   # Number of years of historical price data
    lot_size = client.verify_lot_size()

    # Step 2: Fetch price data from broker API 
    log.info(f"Fetching historical bars for {settings.broker.symbol}")
    bars = analyst.fetch_bars(test=True, test_duration=test_duration)

    # Compute custom start and end time
    end = pd.Timestamp.now().normalize()
    start = end - pd.DateOffset(years=test_duration)
    log.info(f"{'=' * 50}")
    log.info(f"Start date: {start.strftime('%Y/%m/%d')} | End date: {end.strftime('%Y/%m/%d')}")
    
    # Step 3: Compute indicators and signals
    bars = analyst.compute_indicators(bars)
    bars = analyst.get_all_signals(bars)
    log.info("Overview: signal counts -- BUY: %d | SELL: %d",
            (bars["signal"] == 1).sum(), 
            (bars["signal"] == -1).sum())

    # Step 4: Run backtest
    log.info(f"Running backtest (capital={BacktestRisk.initial_capital:,} HKD)")
    result = run_backtest(bars, lot_size)

    # Step 5: Analyse and display results
    stats, eq = analyse_performance(result, bars)
    print("\n" + "=" * 60)
    print(f" BACKTEST RESULTS - Momentum Strategy")
    print("=" * 60)
    for k, v in stats.items():
        print(f"    {k:<28s} {v}")
    print("=" * 60)

    print("\n TRADE LOG:")
    print(f"    {'Entry':<12s} {'Exit':<12s} {'Qty':>0s} {'P&L':>10s} {'%':>6s} {'Reason':>10s}")
    print(" " + "-" * 60)
    for trade in result.trades:
        print(f"{str(trade.entry_date.date()):<12s} "
              f"{str(trade.exit_date.date()) if trade.exit_date else 'OPEN':<12s} "
              f"{trade.quantity:>8d} "
              f"{trade.net_pnl:>10.0f} "
              f"{trade.pnl_pct:>7.2%} "
              f"{trade.exit_reason:>8s}")
    
    # Step 6: Plot graphs
    # plot_results(bars, eq, result.trades, stats)


