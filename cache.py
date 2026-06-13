"""
    A database class that functions as a cache layer for price bars. Edit config.py file for
    switching to another provider.
"""

import logging
import pandas as pd
from configs import AppSettings, LoggingSettings

try:
    import psycopg
except ImportError:
    psycopg = None


LoggingSettings()
log = logging.getLogger(__name__)   # Initialize a named logger 
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

    def _get_conn(self):
        """ Open and return a new psycopg v3 connection.
        """
        if psycopg is None:
            raise RuntimeError("psycopg is not installed. PriceCache is unavailable.")
        return psycopg.connect(**self._db_config, autocommit=True)

    def _ensure_table(self):
        """ Create price_bars table if it doesn't exist yet. Safe to call on every startup.
        """
        with self._get_conn() as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS price_bars (
                    ticker  VARCHAR(20)     NOT NULL,
                    timestamp   DATE        NOT NULL,
                    interval    VARCHAR(10)     NOT NULL,
                    open    DOUBLE PRECISION,
                    high    DOUBLE PRECISION,
                    low     DOUBLE PRECISION,
                    close   DOUBLE PRECISION,
                    volume  BIGINT,
                    PRIMARY KEY (ticker, timestamp, interval)
                )
            """)
        log.info("Price_bars table verified.")
    
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
            end: latest date to retrieve in
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
