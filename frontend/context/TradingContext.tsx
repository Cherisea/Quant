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

