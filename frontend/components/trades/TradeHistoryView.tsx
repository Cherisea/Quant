"use client"

import Link from "next/link";
import {T} from "@/lib/theme";
import { ArrowLeft } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";

export default function TradeHistoryView({ symbol } : {symbol:string}) {
    const { trades } = useTradingContext();
    const filtered = trades.filter(t => !symbol || t.reason !== undefined);

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
            <div>
                {[
                    {label:"Total trades", value:String(), color:T.text},
                    
                ].map(c => (
                    <div>
                        <div>{c.label}</div>
                        <div>{c.value}</div>
                    </div>
                ))}
            </div>


        </div>
    )
}