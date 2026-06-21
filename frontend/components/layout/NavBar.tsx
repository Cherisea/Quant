"use client";

import { T } from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { Search, Plus, Wifi, WifiOff, ChevronDown, ArrowUpRight } from "lucide-react";

export default function NavBar() {
    const { wsConnected } = useTradingContext();

    return (
        <nav style={{
            display: "flex", alignItems: "center", gap: 14,
            padding: "12px 24px", background: T.card,
            borderBottom: `1px solid ${T.border},`
        }}>
            {/* Logo */}
            <div style={{ display:"flex", alignItems:"center", gap:8, marginRight:8, flexShrink:0 }}>
                <div style={{ width:30, height:30, borderRadius:8, background:T.accent,
                display:"flex", alignItems:"center", justifyContent:"center" }}>
                <ArrowUpRight size={15} color="#000"/>
                </div>
                <span style={{ fontSize:15, fontWeight:600, color:T.text, letterSpacing:"-0.02em" }}>
                MomentumBot
                </span>
            </div>

            {/* Search */}
            <div style={{ display:"flex", alignItems:"center", gap:8, flex:1, maxWidth:300,
                background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 12px" }}>
                <Search size={13} color={T.muted}/>
                <span style={{ fontSize:13, color:T.dim }}>Search dashboard…</span>
            </div>

            <div style={{ flex:1 }}/>

            {/* New backtest */}
            <button style={{ display:"flex", alignItems:"center", gap:6, background:T.accent,
                color:"#000", border:"none", borderRadius:8, padding:"8px 16px",
                fontSize:13, fontWeight:600, cursor:"pointer", flexShrink:0 }}>
                New backtest <Plus size={13}/>
            </button>

            {/* WebSocket status */}
            <div style={{ display:"flex", alignItems:"center", gap:5, flexShrink:0,
                background:T.raised, border:`1px solid ${T.border}`, borderRadius:8, padding:"7px 12px" }}>
                {wsConnected
                ? <Wifi    size={12} color={T.green}/>
                : <WifiOff size={12} color={T.red  }/>}
                <span style={{ fontSize:12, color:T.muted }}>
                {wsConnected ? "Connected" : "Disconnected"}
                </span>
            </div>


            
        </nav>
    )
}