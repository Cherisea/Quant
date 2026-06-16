"use client";
import { createContext } from "react";

interface TradingState {
    price:          number;
    position:       number;     // TO BE IMPLEMENTED
    running:        boolean;
    wsConnected:    boolean;
    trades:         number;     // TO BE IMPLEMENTED
    strategy:       number;     // TO BE IMPLEMENTED
    risk:           number;     // TO BE IMPLEMENTED
    setRunning:     boolean;    // TO BE IMPLEMENTED
    setStrategy:    boolean;    // TO BE IMPLEMENTED
    setRisk:        boolean;    // TO BE IMPLEMENTED
}


const TradingContext = createContext<TradingState | null>(null);