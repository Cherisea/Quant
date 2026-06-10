# Momentum Trading on Time Series Data

## Data Source
All price data are fetched through Tiger Trade's Open API servers. Consult your own broker for details if you wish to use a different one or use a third-party data provider.

## Database: Postgres
A Postgres database is employed to avoid triggering [rate limit](https://quant.itigerup.com/openapi/en/python/permission/requestLimit.html) on Tiger API calls (60 times/min for mid frequency interface) caused by repeated price requests and to improve efficiency of data retrieval. 

On runtime, a request will first be routed to the database and only in an event of miss will it be redirected to Tiger API. The newly fetched data will then be immediately appended to a table, allowing for faster retrieval for following requests.

Cache strategy is formulated as:
- Full hit: return price data immediately if database has data up to yesterday. No API calls are initiated.
- Partial hit: fetch only the gap between the last cached date and today, then merge the result with cached rows.
- Full miss: fetch everything from the API and prepare the cache for future calls.

Postgres is chosen to store time-series price due to following considerations:
- **Transactional integrity**: thanks to its strict ACID compliance, Postgres ensures no partial writes survive a crash and that tables always maintain continuous range of data;
- **Efficient retrieval**: Postgres B-tree indexes allows for fast retrieval of price data that's indexed by date columns;
- **Production-ready**: its support for concurrent connections comes in handy when multiple bot instances are run simultaneously; 

## Strategy
This project implements a momentum trading strategy that generates trading signals by comparing 14 days moving average to 30 days moving average and enforcing a minimum 3% rate of change over past 14 days or an elevated 50% more volume than the daily average of past 20 days. In practice, sell signals are also complemented by a 5% trailing stop check designed to catch a sharp decline that won't get reflected in time in EMA. 

## Backtest
Backtest must respect rules in Hong Kong stock market:
- **Trading and settlement**: intraday trading is allowed. Securities and funds are fully delivered two days after a transaction;
- **Trading hours**: morning session lasts from 9:30 a.m. to 12 p.m., and afternoon session starts from 1:00 p.m. to 4 p.m. after a one-hour lunch break;
- **Price limit**: although Hong Kong stocks are not subject to a daily upper or lower bounds on price swings, a 5-minute cooling-off applies to Hang Seng Index and Hang Seng China Enterprise constituent stocks if price fluctuates by more than 10% within 5 minutes;
- **Trade size**: stocks must typically be traded in multiples of a designated "lot size", which varies for different issuers;

and factor in all transaction cost(refer to your broker for a complete list of fees). 

## Performance Metrics
- **Annualized return**: Adjusted for leap years by dividing 365.25 by the number of days in a trading period.
- **Annualized volatility**: Calculated by multiplying daily standard deviation by the square root of total trading days in a year (252).
- **Sharpe ratio**: $\frac{R_p - R_f}{V_p}$
- **Drawdown**: $\frac{Peak - Trough}{Peak}$

## Roadmap
### Backend
- [ ] Store OHLC price info in Postgres to avoid repeated API calls to Tiger API;
- [ ] Extract the backtest engine and live trading bot into a FastAPI service;
- [ ] Store every trade, signal and euqity snapshot in Postgres;
- [ ] Replace logger with a third-party logging tool (Datadog);

### API Gateway
- [ ] Handle authentication, aggregates data from backend and pushes updates to frontend dashboard via WebSockets;
- [ ] Cache the latest stock quote and indicator values in Redis;

### Frontend
- [ ] Build a single-page app that shows the equity curve, open positions, trade history and live signals with React (Material-UI, Recharts);


## Glossary
- Adjusted quote VS Unadjusted quote: adjusted quote (QuoteRight.BR) accounts for corporate actions like dividents and splits, which triggers artifical price actions that don't reflect current market situation. They are smoothed out in our analysis to avoid unintended impact on quotes. 
- Slippage: the difference between an expected price of a trade and the actual execution price, often caused by volatility and large orders.
- Base point(abbr. bp/bps): one hundredth of a percent.
- HKEX transaction fee: check [link](https://www.hkex.com.hk/Services/Rules-and-Forms-and-Fees/Fees/Securities-(Hong-Kong)/Trading/Transaction?sc_lang=en) for a complete and up-to-date fee schedule for each transaction.