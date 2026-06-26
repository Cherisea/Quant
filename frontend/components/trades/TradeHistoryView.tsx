"use client"

import Link from "next/link";
import {T} from "@/lib/theme";
import { ArrowLeft } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";

export default function TradeHistoryView({ symbol } : {symbol:string}) {
    const { trades } = useTradingContext();
    const filtered = trades.filter(t => !symbol || t.reason !== undefined);
    const totalNet = filtered.reduce((s, t) => s + (t.net ?? 0), 0);
    const winners = filtered.filter(t => (t.net ?? 0) > 0);
    const winRate = filtered.length > 0 ? (winners.length / filtered.length) * 100 : 0;

    return (
        <div style={{ padding: "22px 24px"}}>
            {/* Back link */}
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:6,
                color:T.muted, fontSize:12, marginBottom:20, textDecoration:"none"
            }}>
                <ArrowLeft size={13}/>Back to dashboard
            </Link>

            {/* Header */}
            <div style={{ marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:4 }}>
                    <h1 style={{ fontSize:22, fontWeight:600, color:T.text, margin:0 }}>
                        {symbol}
                    </h1>
                    <span style={{ fontSize:13, color:T.muted }}>Trade history</span>
                </div>
                <div style={{ fontSize:11, color:T.dim }}>HKEX · All completed and open trades</div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:26}}>
                {[
                    {label:"Total trades", value:String(filtered.length), color:T.text},
                    {label:"Net P&L", 
                     value:`HK$${totalNet >= 0 ? "+" : ""}${totalNet.toLocaleString(undefined, {maximumFractionDigits:0})}`,
                     color: totalNet >= 0 ? T.green : T.red
                    },
                    {label:"Win rate", value:`${winRate.toFixed(1)}%`, color:T.text},
                    {label:"Symbol", value:symbol, color:T.text},
                ].map(c => (
                    <div key={c.label} style={{ background:T.card, border:`1px solid ${T.border}`,
                         borderRadius:10, padding:"14px 16px" }}>
                        <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase",
                            letterSpacing:"0.06em", marginBottom:6}}>
                            {c.label}
                        </div>
                        <div style={{ fontSize:18, fontWeight:700, color:c.color, fontFamily:"monospace"}}>{c.value}</div>
                    </div>
                ))}
            </div>


        </div>
    )
}