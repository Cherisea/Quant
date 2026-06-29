"use client";

import { T } from "@/lib/theme";
import { useState } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import { BrokerSettings } from "@/lib/types";
import { useTradingContext } from "@/context/TradingContext";
import { AlertTriangle, Play, Square, Database, ArrowUpRight, Wifi, WifiOff } from "lucide-react";
import {
    btnPrimary, btnDanger, 
    btnSecondarySmall, btnDangerSmall,
    paramBox, statLabel, statValue
} from "@/lib/style";

export default function SettingsView() {
    const { running, setRunning, position, wsConnected } = useTradingContext();
    const [broker, setBroker] = useState<BrokerSettings>({ 
        name: "tiger", symbol: "06066", currency: "HKD", exchange: "HKEX", lot_size: 500 
    });
    const [warn, setWarn] = useState(false);

    // A utility function to change a single attribute of BrokerSettings
    const ub = (key: keyof BrokerSettings, value: BrokerSettings[keyof BrokerSettings]) => 
        setBroker(b => ({...b, [key]: value }));

    // Turn on/off backtest engine
    const toggle = async () => {
        if (running && (position?.qty ?? 0) > 0) { setWarn(true); return; }
        try { running ? await api.engineStop() : await api.engineStart(); } catch {}
        setRunning(r => !r);
    };

    // Force stop backtest engine
    const forceStop = async () => {
        try { await api.engineStop(); } catch {}
        setRunning(false);
        setWarn(false);
    };

    const systemInfo = [
        { label:"Symbol", value:broker.symbol },
        { label:"Exchange", value:broker.exchange },
        { label:"Interval", value:"Day" },
        { label:"Lot size", value:`${broker.lot_size}` },
    ];

    return (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, alignItems: "start" }}>
            {/* Left: system overview */}
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden"}}>
                <div style={{ padding:16 }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
                        <div style={{ width:36, height:36, borderRadius:10, flexShrink:0,
                            background:"#0F1117", border:`1px solid ${T.border}`,
                            display:"flex", alignItems:"center", justifyContent:"center"}}>
                            <ArrowUpRight size={15} color={T.accent} />
                        </div>
                        <div>
                            <div style={{ fontSize:14, fontWeight:500, color:T.text }}>MomentumBot</div>
                            <div style={{ fontSize:11, color:T.muted, marginTop:2 }}>06066 · HKEX</div>
                        </div>
                    </div>

                    <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                        {[
                            {
                                icon: <div style={{ width:6, height:6, borderRadius:"50%", flexShrink:0,
                                    background: running ? T.green : T.dim,
                                    animation: running ? "pulse 2s infinite" : "none"}}/>,
                                text: running ? "Engine running" : "Engine stopped",
                            },
                            {
                                icon: wsConnected
                                    ? <Wifi size={11} color={T.green}/>
                                    : <WifiOff size={11} color={T.red}/>,
                                text: `WS ${wsConnected ? "connected" : "disconnected"}`,
                            },
                            {
                                icon: <div style={{ width:14, height:14, borderRadius:"50%", flexShrink:0,
                                    background:"#1A3A2A", display:"flex", alignItems:"center",
                                    justifyContent:"center", fontSize:8, fontWeight:700, color:T.green
                                }}>T</div>,
                                text: "Tiger Trade",
                            },
                        ].map((row, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                                {row.icon}
                                <span style={{ fontSize:12, color:T.muted }}>{row.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop:`1px solid ${T.border}` }}/>

                <div style={{ padding:16 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:"uppercase",
                        letterSpacing:"0.1em", marginBottom:12}}>System</div>
                    <div>
                        {systemInfo.map(m => (
                            <div key={m.label} className={paramBox}>
                                <div className={statLabel}>{m.label}</div>
                                <div className={statValue}>{m.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ borderTop:`1px solid ${T.border}` }}/>
                <div style={{ padding:16, fontSize:11, color:T.muted, lineHeight:1.6 }}>
                    <span style={{ color:T.amber}}>ⓘ</span>{" "}
                    Broker credentials are server-side env vars and never reach the browser.
                </div>
            </div>
            
            {/* Right: setting rows */}
            <div>
                

               
            </div>
        </div>
    );
}
