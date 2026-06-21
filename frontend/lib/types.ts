/**
 * API contract for frontend data types.
 * 
 */

export interface Position {
    qty:            number;
    entry_price:    number;
    current_price:  number;
    symbol:         string;
}

export interface Trade {
    id:             number;
    entry:          string;
    exit:           string | null;
    qty:            number;
    buy:            number;
    sell:           number | null;
    net:            number | null;
    pct:            number | null;
    reason:         "signal" | "trail_stop" | "open" | "end_of_data";
}

export interface EquityPoint {
    date:           string;
    equity:         number;
}

export interface StrategySettings {
    fast_ema:           number;
    slow_ema:           number;
    vol_ma:             number;
    vol_coefficient:    number;
    roc_period:         number;
    roc_threshold:      number;
}

export interface RiskSettings {
    trade_size_pct:     number;
    stop_loss_pct:      number;
    limit_buffer_bps:   number;
    max_wait_sec:       number;
    lookback_bars:      number;
}

export interface BrokerSettings {
    name:               string;
    symbol:             string;
    currency:           string;
    exchange:           string;
    lot_size:           number;
}

export interface WsMessage {
    type:               "tick" | "trade" | "equity" | "engine" | "signal";
    _channel?:           string;
    [key: string]:       unknown;
}

export interface BacktestJob {
    status:             "running" | "done" | "not_found";
    progress:           number;
    result:             Record<string, string | number> | null;
}