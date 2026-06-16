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


