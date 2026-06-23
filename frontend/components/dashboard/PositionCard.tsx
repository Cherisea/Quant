"use client";

import {T} from "@/lib/theme";
import { MoreHorizontal, Plus } from "lucide-react";

export default function PositionCard() {
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

                
            </div>
        </div>
    )
}