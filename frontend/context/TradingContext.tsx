"use client";
import { createContext, useContext } from "react";

interface TradingState {
    price:       number;
    position:    number;    // TO BE IMPLEMENTED
    running:     boolean;
    wsConnected: boolean;
    trades:      number;    // TO BE IMPLEMENTED
    strategy:    number;    // TO BE IMPLEMENTED
    risk:        number;    // TO BE IMPLEMENTED
    setRunning:  boolean;   // TO BE IMPLEMENTED
    setStrategy: boolean;   // TO BE IMPLEMENTED
    setRisk:     boolean;   // TO BE IMPLEMENTED
}

const DEFAULT_STATE: TradingState = {
    price:          0,
    position:       0,     
    running:        false,
    wsConnected:    false,
    trades:         0,     // TO BE IMPLEMENTED
    strategy:       0,     // TO BE IMPLEMENTED
    risk:           0,     // TO BE IMPLEMENTED
    setRunning:     false,    // TO BE IMPLEMENTED
    setStrategy:    false,    // TO BE IMPLEMENTED
    setRisk:        false,    // TO BE IMPLEMENTED
};


const TradingContext = createContext<TradingState>(DEFAULT_STATE);

// Consumer hook
export function useTradingContext(): TradingState {
    return useContext(TradingContext);
}