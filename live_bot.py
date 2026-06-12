import signal
import schedule
import logging
import time

from datetime import datetime
from utils import round_to_lot
from brokers import build_broker
from configs import AppSettings, LoggingSettings, load_settings
from trading import PositionManager, TechAnalyst

_SIGNAL_LABELS = {0: "HOLD", 1: "BUY", -1: "SELL"}
log = logging.getLogger(__name__)   # Initialize a named logger 

class MomentumBot:
    
    def __init__(self, settings: AppSettings) -> None:
        self.broker = build_broker(settings)
        self.broker.connect()
        self.lot_size = self.broker.get_lot_size()
        self.risk = settings.risk
        self.strategy = settings.strategy

        self.pm = PositionManager(self.client, self.lot_size, settings)
        self.analyst = TechAnalyst(self.client, settings)
        self._running = True

        # Register system signals with a custom function
        signal.signal(signal.SIGINT, self._shutdown)
        signal.signal(signal.SIGTERM, self._shutdown)

    def _shutdown(self):
        """Custom signal handler.
        """
        log.info("Shutdown signal received -- stopping bot.")
        self._running = False

    def is_market_hours(self) -> bool:
        """Check if market is open.

        Returns:
            True if market is open, False otherwise.
        """
        now = datetime.now().time()
        lunch_start = datetime.strptime(settings.schedule.lunch_start, "%H:%M").time()
        lunch_end = datetime.strptime(settings.schedule.lunch_end, "%H:%M").time()
        market_open = datetime.strptime(settings.schedule.market_open, "%H:%M").time()
        market_close = datetime.strptime(settings.schedule.market_close, "%H:%M").time()
        if lunch_start <= now <= lunch_end:
            return False
        return market_open < now < market_close

    def tick(self):
        """One evaluation cycle.
        """
        if not self.is_market_hours():
            return

        try:
            # Analyst: fetch data and compute trading signals
            bars = self.analyst.fetch_bars()
            bars = self.analyst.compute_indicators(bars)
            sig = self.analyst.get_latest_signal(bars)
            latest_price = self.analyst.get_last_price()

            fast_ema = bars.iloc[-1]['fast_ema']
            slow_ema = bars.iloc[-1]['slow_ema']
            roc = bars.iloc[-1]['roc']
            pos = self.pm.position
            log.info("TICK: price=%.3f | fast_ema=%.3f | slow_ema=%.3f | roc=%.4f | signal=%s | pos=%d",
                    latest_price, fast_ema, slow_ema, roc, _SIGNAL_LABELS[sig], pos)
            
            # Trailing stop order check
            if self.pm.check_trailing_stop(latest_price):
                sig = -1
            
            # Execute sell
            if sig == -1 and pos > 0:
                order_id = self.executor.place_limit_order(pos, latest_price, "SELL")
                if order_id and self.executor.wait_for_fill(order_id):
                    log.info(f"SOLD {pos} shares of {self.client.symbol}")
                    self.pm.close_pos()
                else:
                    log.warning("SELL order did not fill -- will retry in next tick.")
            
            # Execute buy
            elif sig == 1 and self.pm.position == 0:
                equity = self.pm.get_balance()
                budget = equity * self.risk.trade_size_pct
                raw_qty = budget // latest_price
                qty = round_to_lot(raw_qty)
                if qty <= 0:
                    log.warning(f"Insufficient equity for a full lot (equity={equity}, price={latest_price})")
                    return
                
                order_id = self.executor.place_limit_order(qty, latest_price, "BUY")
                if order_id and self.executor.wait_for_fill(order_id):
                    self.pm.position = qty 
                    self.pm.entry_price = latest_price
                    self.pm.highest_since_entry = latest_price
                    log.info(f"BOUGHT {qty} shares of {self.client.symbol} at {latest_price:.3f}")
                else:
                    log.warning("BUY order did not fill -- will retry in next tick.")
        except Exception as e:
            log.warning(f"Error during tick: {e}")
                
    def run(self):
        """Main loop -- schedule ticks at a set interval.
        """
        log.info("=" * 60)
        log.info(f"  Momentum Bot STARTED -- Trading {self.client.symbol} on Tiger Trade")
        log.info(f"  Account: {self.broker.tiger_account} | Lot size: {self.lot_size}")
        log.info("  Strategy: EMA(%d/%d)  +  ROC(%.3f)  +  Vol_MA(%d) + Vol_Coefficient(%.1f)",
                    self.strategy.fast_ema, self.strategy.slow_ema, self.strategy.roc_threshold, 
                    self.strategy.vol_ma, self.strategy.vol_coefficient)
        log.info(f"  Position sizing: {self.risk.trade_size_pct} | Stop loss: {self.risk.stop_loss_pct}")
        log.info("=" * 60)

        # Run an immediate tick and schedule the next one
        self.tick()
        schedule.every(settings.schedule.tick_interval).minutes.do(self.tick)

        while self._running:
            schedule.run_pending()      # Run all jobs that are due
            time.sleep(1)

        log.info("Bot stopped cleanly.")

if __name__ == "__main__":
    settings = load_settings()
    LoggingSettings()

    # Start the bot
    bot = MomentumBot(settings)
    bot.run()