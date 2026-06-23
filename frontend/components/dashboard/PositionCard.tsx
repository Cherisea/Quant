"use client";

import {T} from "@/lib/theme";

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
                            
                        </div>
                    </div>
                    
                </div>
            </div>
        </div>
    )
}