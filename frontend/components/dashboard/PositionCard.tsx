"use client";

import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";
import { MoreHorizontal, Plus } from "lucide-react";

export default function PositionCard() {
    const { price, position } = useTradingContext();
    
    const qty = position?.qty ?? 0;
    const isOpen = qty > 0;
    const entryPrice = position?.entry_price ?? 0;
    const capital = Math.round(qty * entryPrice);
    

    return (
        <div style={{ background:T.card, border: `1px solid ${T.border}`,
            borderRadius:14, overflow:"hidden", display:"flex", flexDirection:"column"}}>
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
                    </div>
                </div>
            </div>
        </div>
    )
}