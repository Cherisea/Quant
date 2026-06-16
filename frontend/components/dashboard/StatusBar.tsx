"use client";
import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";

function Divider() {
    return <div style={{ width:1, height:36, background: "white", flexShrink:0 }} />;
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

    return (
        <div style={{
            display: "flex", alignItems: "center", gap: 18, padding: "10px 20px",
            borderBottom: `1px solid ${T.border}`, background: T.surface, flexWrap: "wrap",
        }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 5}}>
                <span style={{ fontSize:20, fontWeight:700, color:T.text, fontFamily:"monospace" }}>{price.toFixed(3)}</span>
                <span style={{ fontSize:10, color:T.muted }}>HKD</span>
            </div>

            <Divider/>
            {stats.map(([label, value, color]) => (
                <div key={label}>
                <div style={{ fontSize:9, color:T.dim, textTransform:"uppercase", letterSpacing:".05em", marginBottom:1 }}>{label}</div>
                <div style={{ fontSize:12, fontFamily:"monospace", color:color ?? T.text, fontWeight:500 }}>{value}</div>
                </div>
            ))}

            <div style={{ marginLeft:"auto", display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:T.green, animation:"pulse 2s infinite" }}/>
                <span style={{ fontSize:10, color:T.muted }}>Live · 06066</span>
            </div>
        </div>
    )
}