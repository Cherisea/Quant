import yfinance as yf
import pandas as pd

tickers = "RBLX"
data = yf.download(tickers, start="2025-01-01", end="2026-01-01")
print(data.head())