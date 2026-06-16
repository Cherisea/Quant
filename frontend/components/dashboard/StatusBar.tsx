"use client";
import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";

function Divider() {
    return <div style={{ width:1, height:24, background: "white", flexShrink:0 }} />;
}

export default function StatusBar() {
    const { price, position } = useTradingContext();
    const pnl = position?.qty ? (price - position.entry_price) * position.qty : 0;
    const pnlPct = position?.qty ? (price / position.entry_price - 1) * 100 : 0;

    const stats = [
        ["Position", position?.qty ? `${position.qty.toLocaleString()} shares` : "Flat", null],
        ["Entry", position?.qty ? `HK$${position.entry_price.toFixed(2)}` : "-", null],
        ["Unrealized", position?.qty ? `HK$${pnl >= 0 ? "+" : ""}${pnl.toLocaleString(undefined, {maximumFractionDigits:0})}` 
                                     : "-", pnl >= 0 ? T.green : T.red],
        ["P&L %", position?.qty ? `${pnlPct >=0 ? "+" : ""}${pnlPct.toFixed(2)}%` : "-", pnlPct >= 0 ? T.green : T.red],
    ] as const;

    
}