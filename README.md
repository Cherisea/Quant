# Momentum Trading on Time Series Data

## Data Source
Tushare for Chinese A-share market. 

## Strategy
This project implements a momentum trading strategy that generates trading signals by comparing 20 days moving average to 60 days moving average. 

## Backtest
Backtest must respect rules in Chinese market:
- T+1 settlement: can't buy and sell on the same day;
- No short selling: retail investors are not allowed to engage in short selling;
- Daily price limits: price swings are capped at +/- 10%;
- Lunch break: trading completely freezes from 11:30 AM -- 1:00 PM CST;

and factor in transaction cost:
- Commission: 0.01%
- Stamp tax on sells: 0.05%
- Slippage: 1 - 2 transactions if we place limit orders;

## Roadmap
- [ ] Move current_trade and equity_curve to a database;
- [ ] Replace logger with a third-party logging tool;

## Glossary
- Adjusted quote VS Unadjusted quote: adjusted quote (QuoteRight.BR) accounts for corporate actions like dividents and splits, which triggers artifical price actions that don't reflect current market situation. They are smoothed out in our analysis to avoid unintended impact on quotes. 
- Slippage: the difference between an expected price of a trade and the actual execution price, often caused by volatility and large orders.
- Base point(abbr. bp/bps): one hundredth of a percent.
- HKEX transaction fee: check [link](https://www.hkex.com.hk/Services/Rules-and-Forms-and-Fees/Fees/Securities-(Hong-Kong)/Trading/Transaction?sc_lang=en) for a complete and up-to-date fee schedule for each transaction.