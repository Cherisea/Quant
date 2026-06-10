"""
A live momentum trading bot that connects to Tiger Trade via tigeropen SDK. Trading strategy can be configured in a 
separate script. 
"""

# System and third-party imports
import time
import logging
import psycopg
import pandas as pd
import pandas_market_calendars as pmc

from utils import setup_logging
from typing import Optional
from configs import AppSettings, load_settings

# Tiger trade SDK
from tigeropen.common.consts import (
    BarPeriod, QuoteRight,
    SecurityType, OrderStatus
)
from tigeropen.quote.quote_client import QuoteClient
from tigeropen.trade.trade_client import TradeClient
from tigeropen.common.util.contract_utils import stock_contract
from tigeropen.common.util.order_utils import limit_order
from tigeropen.tiger_open_config import TigerOpenClientConfig

# Load logger settings from root logger
settings = load_settings()
setup_logging(settings.logging.file, settings.logging.level)
log = logging.getLogger(__name__)   # Initialize a named logger 

# Mapping from timeframe label to BarPeriod and vice versa
tf_to_bp = {
    "Hour": BarPeriod.ONE_HOUR, "Day": BarPeriod.DAY, "Week": BarPeriod.WEEK, "Month": BarPeriod.MONTH
}
bp_to_tf = {
    BarPeriod.ONE_HOUR: "Hour", BarPeriod.DAY: "Day", BarPeriod.WEEK: "Week", BarPeriod.MONTH: "Month"
}

class TigerClient:
    """Quote and trade agent for interacting with Tiger Trade platform.
    """
    def __init__(self, settings: AppSettings) -> None:
        self.symbol = settings.broker.symbol
        self.settings = settings
        self.cfg = self._build_config()

        self.quote = QuoteClient(self.cfg)
        self.trade = TradeClient(self.cfg)
        self.contract = stock_contract(symbol=self.symbol, currency=settings.broker.currency)    # Security to trade
        log.info(f"Tiger client initialized.")
    
    def verify_lot_size(self) -> int:
        """Fetch actual lot size from exchange metadata.
        """
        try:
            meta = self.quote.get_trade_metas([self.symbol])
            ls = meta["lot_size"].iloc[0]
            log.info(f"Verified lot size for {self.symbol}: {ls}")
            return ls.item()
        except Exception as e:
            ls = self.settings.broker.lot_size
            log.warning(f"{e}. Could not verify lot size. Using default size of {ls}")
            return ls.item()

    def _build_config(self) -> TigerOpenClientConfig:
        """Configure tiger client by retrieving constants from settings.
        """
        if self.settings.broker.props_path:
            cfg = TigerOpenClientConfig(props_path=self.settings.broker.props_path)
        else:
            cfg = TigerOpenClientConfig()
            cfg.private_key = self.settings.broker.private_key
            cfg.tiger_id = self.settings.broker.tiger_id
            cfg.tiger_account = self.settings.broker.tiger_account
        cfg.timezone = self.settings.broker.tz
        return cfg

class TechAnalyst:
    """An analyst that pulls market data, compute technical indicators and generate trading signals.
    """
    def __init__(self, client: TigerClient, settings: AppSettings) -> None:
        self.client = client
        self.strategy = settings.strategy
        self.risk = settings.risk
        self.broker = settings.broker
        self.interval = tf_to_bp[self.broker.interval]

        # Market calendar for resolving valid trading days
        self.calendar = pmc.get_calendar(self.broker.exchange)
        
        # Initialize DB cache
        try:
            self.cache = PriceCache(settings)
        except Exception as e:
            log.warning("DB cache init failed (%s) - running without cache.", e)
            self.cache = None
    
    def get_last_price(self) -> float:
        """Fetch latest closing price of a security. Be mindful of exchange imposed price quote delay.

        Returns:
            Security price as a float.
        """
        brief = self.client.quote.get_stock_briefs([self.client.symbol])
        return brief['close'].iloc[0]

    def fetch_bars(self, test: bool=False, test_duration: int=3) -> pd.DataFrame:
        """ Fetch historical OHLC data, serving from local Postgres cache where
            possible and fall back to to Tiger API for any missing date range.

        Args:
            test: if backtest mode is on or not
            test_duration: how far back to pull historical price data for backtest. 
                            Measured in years.

        Returns:
            Dataframe with DatetimeIndex and OHLCV columnsm sorted in ascending order.
        """
        end = pd.Timestamp.now().normalize()

        if test:
            start = end - pd.DateOffset(years=test_duration)
        else:
            # Convert trading day lookback into calendar days, with a generous buffer
            # to account for public holidays and weekends.
            cal_days = int(self.risk.lookback_bars * self.risk.calender_days / self.risk.trading_days) + 30
            start = end - pd.DateOffset(days=cal_days)
        
        # Stage 1: local cache
        cached = pd.DataFrame()
        if self.cache is not None:
            try: 
                cached = self.cache.load_bars(start, end, self.broker.interval)
            except Exception as e:
                log.warning("DB read failed (%s) - skipping cache.", e)
        
        # Check if it's a full hit or partial hit
        if not cached.empty:
            latest_cached = cached.index[-1]
            if latest_cached >= end - pd.Timedelta(days=1):
                log.info(f"Cache hit: returning {len(cached)} bars from DB for {self.broker.symbol}")
                return cached
            fetch_start = latest_cached + pd.Timedelta(days=1)
            log.info(f"Partial cache hit: fetching gap {fetch_start.date()} -> {end.date()} from API.")
        else:
            fetch_start = start
            log.info(f"Cache miss: fetching {start.date()} -> {end.date()} from API.")
        
        # Stage 2: fetch missing date range
        api_bars = self.client.quote.get_bars(
            symbols=[self.client.symbol],
            period=self.interval,
            right=QuoteRight.BR,
            begin_time=fetch_start.strftime("%Y-%m-%d"),
            end_time=end.strftime("%Y-%m-%d"),
        )

        if api_bars is None or api_bars.empty:
            if not cached.empty:
                log.warnning("API returned no new bars; returning cached data only.")
                return cached
            raise RuntimeError("Failed to fetch bar data.")

        api_bars["time"] = pd.to_datetime(api_bars["time"], unit="ms")
        api_bars.set_index("time", inplace=True)
        api_bars.sort_index(inplace=True)

        # Normalize to the same columns as DB output
        ohlcv = [c for c in ("open", "high", "low", "close", "volume") if c in api_bars.columns]
        api_bars = api_bars[ohlcv].copy()

        # Stage 3: persist the new bars
        if self.cache is not None:
            try:
                self.cache.insert_bars(api_bars, bp_to_tf[self.interval])
            except Exception as e:
                log.warning(f"DB write failed {e} - continuing without caching retrieved result.")
        
        # Stage 4: merge cached rows with API call result
        if not cached.empty:
            combined = pd.concat([cached, api_bars])
            combined = combined[~combined.index.duplicated(keep="last")].sort_index()
            return combined
        return api_bars


    def compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate technical indicators such as fast EMA, slow EMA, rate of change and average volume.

        Returns:
            Original dataframe with derived columns of technical indicators.
        """ 
        df = df.copy()
        df["fast_ema"] = df["close"].ewm(span=self.strategy.fast_ema, adjust=False).mean()
        df["slow_ema"] = df["close"].ewm(span=self.strategy.slow_ema, adjust=False).mean()
        df["roc"] = df["close"].pct_change(self.strategy.roc_period)
        df["vol_ma"] = df["volume"].rolling(self.strategy.vol_ma).mean()
        return df

    def get_latest_signal(self, df: pd.DataFrame) -> int:
        """ Retrieve yesterday's trading signal for today's transaction.
        """
        return self.get_all_signals(df).iloc[-2]['signal']

    def get_all_signals(self, df: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals for all rows of a dataframe. This method is 
            designed for backtesting.

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

        momentum = df['roc'] > self.strategy.roc_threshold
        volume = df['volume'] > self.strategy.vol_coefficient * df['vol_ma']

        df.loc[cross_up & (momentum | volume), 'signal'] = 1     # Buy signal
        df.loc[cross_down, "signal"] = -1        # Sell signal

        return df

class PositionManager:
    """A manager that tracks current position, entry price and trailing stop orders.
    """
    def __init__(self, clients:TigerClient, lot_size: int, settings: AppSettings) -> None:
        self.clients = clients
        self.risk = settings.risk
        self.broker = settings.broker
        self.lot_size = lot_size

        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0      # Updated for trailing stop orders
        self._sync_from_broker()

    def _sync_from_broker(self):
        """Read actual positions and average cost from Tiger Trade on startup.
        """
        try:
            data = self.clients.trade.get_positions(account=self.broker.tiger_account, 
                    sec_type=SecurityType.STK, symbol=self.clients.symbol)
            if data is not None and len(data) != 0:
                row = data[0]
                self.position = int(row.quantity)
                self.entry_price = float(row.average_cost)
                self.highest_since_entry = self.entry_price
                log.info(f"Synced position: {self.position} shares @{self.entry_price:.3f}")
            else:
                log.info(f"No existing position in {self.clients.symbol}")
        except Exception as e:
            log.warning(f"Couldn't sync position: {e}")

    def close_pos(self):
        """Close all positions in an account.
        """
        self.position = 0
        self.entry_price = 0.0
        self.highest_since_entry = 0.0
    
    def get_balance(self) -> float:
        """Fetch available cash from prime/paper account.

        Returns:
            Balance in account if no exception is thrown, otherwise returns 0.0.
        """
        try:
            data = self.clients.trade.get_prime_assets(account=self.broker.tiger_account)
            cash = data.segments['S'].currency_assets.get(self.clients.currency).cash_available_for_trade
            if cash <= 0:
                log.warning(f"No {self.clients.currency} cash available for trading {self.clients.symbol}.")
            else:
                return cash 
        except Exception as e:
            log.warning(f"Couldn't fetch balance: {e}")
        return 0.0
    
    def check_trailing_stop(self, current_price: float) -> bool:
        """Check if a trailing stop order set at a fixed percentage point should be triggered. Note
            this order lives on the software side, not broker side. Move it to the broker side
            to ensure it still triggers even when the bot experiences downtime.
        
        Args:
            current_price: current price of security.
        
        Returns:
            True if a trailing stop order should be triggered; otherwise False.
        """
        if self.position <= 0:
            return False
        
        self.highest_since_entry = max(self.highest_since_entry, current_price)
        stop_point = self.highest_since_entry * (1 - self.risk.stop_loss_pct)
        if current_price <= stop_point:
            log.warning(f"TRAILING STOP HIT: price = {current_price}, stop={stop_point}, peak={self.highest_since_entry}")
            return True
        return False

class OrderExecutor:
    """An executor for placing limit buy and sell orders.
    """
    def __init__(self, clients: TigerClient, settings: AppSettings) -> None:
        self.client = clients
        self.risk = settings.risk

    def place_limit_order(self, qty: int, ref_price: float, direct: str) -> Optional[int]:
        """Place a limit order priced at a certain range of reference price.

        Args:
            qty: number of shares that's a multiple of lot size.
            ref_price: base price an order is placed at.
            direct: direction of order. Must be either "BUY" or "SELL".
        
        Return:
            None if order is successfully placed, or order id as an integer if operation succeeds.
        """
        if direct not in ["BUY", "SELL"]:
            raise ValueError("Direction of limit orders must be either buy or sell. Aborting...")
        
        if direct == "BUY":
            lim_price = round(ref_price * (1 + self.risk.limit_buffer_bps / 10_000), 3)
        else:
            lim_price = round(ref_price * (1 - self.risk.limit_buffer_bps / 10_000), 3)

        order = limit_order(
            account=self.client.account,
            contract=self.client.contract,
            action=direct,
            limit_price=lim_price,
            quantity=qty,
        )
        try:
            self.client.trade.place_order(order)
            log.info(f"{direct} order placed: {qty} at {lim_price}, order_id={order.id}")
            return order.id
        except Exception as e:
            log.error(f"Failed to place {direct} order: {e}")
            return None

    def wait_for_fill(self, order_id: int) -> bool:
        """Poll order status until filled or timeout, then cancel if unfilled.

        Args:
            order_id: order to be operated on.
        
        Returns:
            True if order is filled, otherwise False. Check logs for details.
        """
        start = time.time()
        while time.time() - start < self.risk.max_wait_sec:
            try:
                order = self.client.trade.get_order(id=order_id)
                status = order.status if hasattr(order, "status") else None
                if status in (OrderStatus.FILLED, "Filled", "FILLED"):
                    log.info(f"Order {order_id} FILLED (avg_price={getattr(order, 'avg_filled_price', 0)})")
                    return True
                if status in (OrderStatus.CANCELLED, OrderStatus.REJECTED, 
                                "Cancelled", "Rejected", "CANCELLED", "REJECTED"):
                    log.warning(f"Order {order_id} was {status}")
                    return False
            except Exception as e:
                log.warning(f"Error polling order {order_id}: {e}")
            time.sleep(3)

        # Timeout - cancel the order
        log.warning(f"Order {order_id} not filled after {self.risk.max_wait_sec} -- cancelling")
        try:
            self.client.trade.cancel_order(id=order_id)
        except Exception as e:
            log.error(f"Failed to cancel order: {e}")
        return False 

class PriceCache:
    """ Local Postgres cache for OHLV price bars. This class contains everything related to the database: 
        CRUD operations and the lastest cached date query used by database sync job. 
    """

    def __init__(self, settings: AppSettings):
        """
        """
        self.ticker = settings.broker.symbol
        self._db_config = {
            "host": settings.db.host,
            "dbname": settings.db.name,
            "user": settings.db.user,
            "password": settings.db.password,
            "port": settings.db.port
        }
        self._ensure_table()

    def _get_conn(self) -> psycopg.Connection:
        """ Open and return a new psycopg v3 connection.
        """
        return psycopg.connect(**self._db_config)

    def _ensure_table(self):
        """ Create price_bars table if it doesn't exist yet. Safe to call on every startup.
        """
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS price_bars (
                    ticker  VARCHAR(20)     NOT NULL,
                    timestamp   DATE        NOT NULL,
                    interval    VARCHAR(10)     NOT NULL,
                    open    DECIMAL(12, 4),
                    high    DECIMAL(12, 4),
                    low     DECIMAL(12, 4),
                    close   DECIMAL(12, 4),
                    volume  BIGINT,
                    PRIMARY KEY (ticker, timestamp, interval)
                )
            """)
        log.info("Price_bars table verified.")

    def get_latest_date(self, interval: str) -> Optional[pd.Timestamp]:
        """ Get the most recent date for current ticker and interval pair.

        Args:
            interval: bar timeframe stored in the table (e.g. "DAY).
        
        Returns:
            Most recent date for current pair, or None if the pair doesn't exist.
        """
        with self._get_conn as conn:
            row = conn.execute(
                "SELECT MAX(timestamp) FROM price_table WHERE ticker = %s AND interval = %s",
                (self.ticker, interval)
            ).fetchone()

        if row and row[0] is not None:
            return pd.Timestamp(row[0])
        return None
    
    def insert_bars(self, df: pd.DataFrame, interval: str) -> None:
        """ Bulk insert OHLCV rows, sliently skipping any that already exists.
        """
        if df.empty:
            return
        
        rows = []
        for row in df.itertuples():
            rows.append((
                self.ticker,
                getattr(row, "Index"),
                interval,
                getattr(row, "open", None),
                getattr(row, "high", None),
                getattr(row, "low", None),
                getattr(row, "close", None),
                getattr(row, "volume", None),
            ))

        conn = self._get_conn()
        try:
            cur = conn.cursor()
            cur.executemany(
                """
                INSERT INTO price_bars
                    (ticker, timestamp, interval, open, high, low, close, volume)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (ticker, timestamp, interval) DO NOTHING
                """,
                rows,
            )
            cur.close()
        finally:
            conn.close()
        log.info(f"Cached {len(rows)} bars for {self.ticker} [{interval}]")
    
    def load_bars(self, start: pd.Timestamp, end: pd.Timestamp, interval: str) -> pd.DataFrame:
        """ Read price bars within a specified time period, inclusive on both ends
        
        Args:
            start: earliest date to retrieve
            end: latest date to retrieve
            interval: bar timeframe label
        
        Returns:
            Dataframe with DatetimeIndex and OHLCV columns sorted ascending, or an empty Dataframe 
            if nothing is cached for the requested time range.
        """
        conn = self._get_conn()
        try:
            cur = conn.cursor()
            cur.execute(
                """
                    SELECT timestamp, open, high, low, close, volume
                    FROM price_bars
                    WHERE ticker = %s
                    AND   interval = %s
                    AND timestamp BETWEEN %s AND %s
                    ORDER BY timestamp ASC
                """,
                (self.ticker, interval, start.date(), end.date()),
            )
            rows = cur.fetchall()
            cur.close()
        finally:
            conn.close()

        if not rows:
            return pd.DataFrame()
        
        df = pd.DataFrame(rows, columns=["time", "open", "high", "low", "close", "volume"])

        # Convert datetime.date to pandas datetime type
        df["time"] = pd.to_datetime(df["time"])
        df.set_index("time", inplace=True)
        return df
