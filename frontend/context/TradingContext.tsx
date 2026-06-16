"use client";

import type { Position, Trade, StrategySettings, RiskSettings, WsMessage } from "@/lib/types";
import { createContext, useContext, useState, useEffect, 
         useCallback, type ReactNode, type Dispatch, type  SetStateAction,
} from "react";

interface TradingState {
    price:          number;
    position:       Position | null;   
    running:        boolean;
    wsConnected:    boolean;
    trades:         Trade[];    
    strategy:       StrategySettings;   
    risk:           RiskSettings;    
    setRunning:     Dispatch<SetStateAction<boolean>>;  
    setStrategy:    Dispatch<SetStateAction<StrategySettings>>;
    setRisk:        Dispatch<SetStateAction<RiskSettings>>;
}


const TradingContext = createContext<TradingState | null>(null);

// ------------------- Defaults -----------------------
const DEFAULT_STRATEGY: StrategySettings = {
    fast_ema: 14, slow_ema: 30, vol_ma: 20,
    vol_coefficient: 1.5, roc_period: 14,
    roc_threshold: 0.03,
};
const DEFAULT_RISK: RiskSettings = {
    trade_size_pct: 0.6, stop_loss_pct: 0.05,
    limit_buffer_bps: 10,
    max_wait_sec: 60,
    lookback_bars: 240,
};

export function TradingProvider({ children}: { children: ReactNode }) {

}