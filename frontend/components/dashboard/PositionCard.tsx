"use client";

import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";
import { useMemo } from "react";
import Sparkline from "./Sparkline";
import Link from "next/link";
import { MoreHorizontal, Plus } from "lucide-react";

// Synthetic data for drawing sparkline in bottom of card
function generateSparkData(seed: number) {
    return Array.from({length: 30}, (_, i) => ({
        v: 100 + Math.sin(i*0.4 + seed) * 8 + i * 1.5 + Math.sin(i*1.2) * 3,
    }));
}

export default function PositionCard() {
    const { price, position } = useTradingContext();
    const spark = useMemo(() => generateSparkData(1), []);
    
    const qty = position?.qty ?? 0;
    const isOpen = qty > 0;
    const entryPrice = position?.entry_price ?? 0;
    const capital = Math.round(qty * entryPrice);
    const gain = Math.round(price - entryPrice) * qty;
    const gainPct = entryPrice > 0 ? ((price - entryPrice) / entryPrice) * 100 : 0;
    const gainColor = gain >= 0 ? T.green : T.red;
    const symbol = position?.entry_price ?? "06066";

    // No open position view
    if (!isOpen) {
        return (
        <div style={{ background:"transparent", border:`1.5px dashed ${T.border}`,
            borderRadius:14, display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center", gap:10,
            padding:24, cursor:"pointer", minHeight:190 }}>
            <div style={{ width:48, height:48, borderRadius:12, background:T.raised,
            display:"flex", alignItems:"center", justifyContent:"center" }}>
            <Plus size={20} color={T.green}/>
            </div>
            <span style={{ fontSize:12, fontWeight:500, color:T.muted }}>No open position</span>
        </div>
        );
    }

    return (
        <Link href={`/trades/${symbol}`} style={{ textDecoration:"none" }}>
            <div style={{ background:T.card, border: `1px solid ${T.border}`,
                borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column",
                cursor:"pointer", transition:"border-color 0.15s"}}
                onMouseEnter={e => ((e.currentTarget as HTMLDivElement).style.borderColor=T.accent)}
                onMouseLeave={e => ((e.currentTarget as HTMLDivElement).style.borderColor=T.border)}>
                <div style={{ padding: "16px 16px 12px"}}>
                    {/* Header */}
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:14}}>
                        <div style={{ display:"flex", alignItems:"center", gap:10}}>
                            <div style={{ width:38, height:38, borderRadius:"50%",
                            background:"#1A1A2E", border:`1px solid ${T.border}`,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:12, fontWeight:600, color:T.blue}}>
                            06
                            </div>
                            <div>
                                <div style={{fontSize:13, fontWeight:500, color:T.text}}>06066</div>
                                <div style={{fontSize:10, color:T.muted, marginTop:2}}>
                                    HKEX · Live since June 2026
                                </div>
                            </div>
                        </div>
                        <div style={{ display:"flex", alignItems:"center", gap:8}}>
                            <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.06em",
                                background:"rgba(0,212,106,0.12)", color:T.green,
                                padding:"3px 7px", borderRadius:4}}>LIVE</span>
                            <MoreHorizontal size={14} color={T.dim} style={{cursor:"pointer"}}/>
                        </div>
                    </div>

                    {/* Stats */}
                    <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10}}>
                        <div>
                            <div style={{ fontSize:10, color:T.muted, marginBottom:4}}>Capital</div>
                            <div>
                                HK${capital.toLocaleString(undefined, {maximumFractionDigits:0})}
                            </div>
                        </div>

                        <div>
                            <div style={{ fontSize:10, color:T.muted, marginBottom:4}}>Unrealized</div>
                            <div style={{ fontSize:16, fontWeight:700, fontFamily:"monospace", color:gainColor }}>
                                {gain >= 0 ? "+" : ""}{gain.toLocaleString(undefined, {maximumFractionDigits:0})}
                                <span style={{ fontSize:11, marginLeft:4 }}>
                                    ({gainPct >= 0 ? "+" : ""}{gainPct.toFixed(1)}%)
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* Sparkline flush to card bottom */}
                <div style={{ marginTop: "auto" }}>
                    <Sparkline data={spark} color={gainColor} height={72} />
                </div>
            </div>
        </Link>
    )
}