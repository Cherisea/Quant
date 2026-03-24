import akshare as ak
import numpy as np

# Retrieve data 
df = ak.stock_zh_a_daily(symbol="sh600266", start_date="20250101", end_date="20260213")
df = df[["date", "close", "volume"]]

# Compute short-term and long-term momentum
df["Short_MA"] = df['close'].rolling(window=20).mean()
df["Long_MA"] = df['close'].rolling(window=99).mean()

# Derive trading signals
df["Signal"] = np.where(df["Short_MA"] > df["Long_MA"], 1, -1)  # 1 - Positive signal

# Daily returns
df["Return"] = df["close"].pct_change()
df["Strategy_Return"] = df["Return"] * df["Signal"].shift(1)

# Cumulative returns
df["Cumulative_Return"] = (1 + df["Return"]).cumprod()
df["Strategy_Cumulative_Return"] = (1 + df["Strategy_Return"]).cumprod()

print(df.tail())