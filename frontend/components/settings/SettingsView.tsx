"use client";

import { T } from "@/lib/theme";
import { useState } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import { BrokerSettings } from "@/lib/types";
import { useTradingContext } from "@/context/TradingContext";
import NumInput from "../ui/NumInput";
import { AlertTriangle, Play, Square, Database, ArrowUpRight } from "lucide-react";
import {
    input, select, btnPrimary, btnDanger, 
    btnSecondarySmall, btnDangerSmall
} from "@/lib/style";

const BROKER_TEXT_FIELDS: { label: string; key: keyof BrokerSettings }[] = [
    { label: "Symbol", key: "symbol" },
    { label: "Currency", key: "currency" },
    { label: "Exchange", key: "exchange" },
];

export default function SettingsView() {
    const { running, setRunning, position } = useTradingContext();
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
    }

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
                        ].map((row, i) => (
                            <div key={i} style={{ display:"flex", alignItems:"center", gap:8 }}>
                                {row.icon}
                                <span style={{ fontSize:12, color:T.muted }}>{row.text}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div />

                <div>
                    <div>System</div>
                    <div>

                    </div>
                </div>

                <div />
                <div>
                    Broker credentials are server-side env vars and never reach the browser.
                </div>
            </div>
            
            {/* Right: setting rows */}
            <div>
                {/* Engine control */}
                <Card title="Engine control">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "12px 14px", background: T.raised, borderRadius: 7, marginBottom: 12}}>
                        <div>
                            <div style={{ fontSize: 12, fontWeight: 500, color: T.text }}>Trading engine</div>
                            <div style={{ fontSize: 10, color: T.muted, marginTop: 2}}>
                                {running ? "Ticking every 10 min during market hours" : "Stopped - no orders will be placed"}
                            </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8}}>
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background:running?T.green:T.dim }}/>
                            <button onClick={toggle} className = {running ? btnDanger: btnPrimary} 
                                style={{ padding: "5px 12px", fontSize:11 }}>
                                {running ? <><Square size={10}/>Stop</> : <><Play size={10}/>Start</>}
                            </button>
                        </div>
                    </div>
                    
                    {/* Warning box */}
                    {warn && (
                        <div style={{ padding: "11px 13px", background: "rgba(255,77,106,0.08)", border: `1px solid rgba(255,77,106,0.2)`, borderRadius: 7, marginBottom: 12}}>
                            <div style={{ display: "flex", gap: 8 }}>
                                <AlertTriangle size={13} color={T.amber} style={{ flexShrink: 0, marginTop: 1}} />
                                <div>
                                    <div style={{ fontSize: 11, fontWeight: 500, color: T.amber, marginBottom: 4 }}>
                                        Open position - trailing stop will stop watching
                                    </div>
                                    <div style={{ fontSize: 10, color:T.muted, lineHeight: 1.7, marginBottom: 10}}>
                                        You hold <b style={{ color: T.text}}>{position?.qty.toLocaleString()} shares.</b>{" "}
                                        Place a resting broker-side stop order before stopping the engine.
                                    </div>
                                    <div style={{ display: "flex", gap: 8 }}>
                                        <button onClick={forceStop} className={btnDangerSmall}>Stop anyway</button>
                                        <button onClick={() => setWarn(false)} className={btnSecondarySmall}>Cancel</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {["Engine runs independently - logout doesn't stop it.",
                       "Positions remain protected when the UI is closed.",
                       "To switch brokers: go flat, change BROKER_NAME, restart."
                    ].map(t => <div key={t} style={{ fontSize: 10, color: T.dim, padding: "3px 0"}}>· {t}</div>)}
                </Card>

                {/* Cache status */}
                <Card title="Price cache" sub="Postgres OHLCV store" style={{ marginTop: 14}}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10}}>
                        <Database size={11} color={T.green}/>
                        <span style={{ fontSize: 11, color: T.muted }}>quant_db @ localhost:5432</span>
                    </div>
                    {[["Cached bars","1,247"],["Symbol","06066 · DAY"],["Latest","Jun 14, 2026"],["Adapter","CachedBrokerAdapter"]].map(([k,v]) => (
                        <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"5px 0",
                        fontSize:11, borderBottom:`1px solid ${T.border}` }}>
                        <span style={{ color:T.muted }}>{k}</span>
                        <span style={{ color:T.text, fontFamily:"monospace" }}>{v}</span>
                        </div>
                    ))}
                </Card>
            </div>
        </div>
    );
}
