"use client";

import { T } from "@/lib/theme";
import { useState } from "react";
import { api } from "@/lib/api";
import SectionLabel from "../ui/SectionLabel";
import SettingRow from "../ui/SettingRow";
import Stepper from "../ui/Stepper";
import { BrokerSettings } from "@/lib/types";
import { useTradingContext } from "@/context/TradingContext";
import { AlertTriangle, Play, Square, Database, ArrowUpRight, Wifi, WifiOff } from "lucide-react";
import {
    btnPrimary, btnDanger, 
    btnSecondarySmall, btnDangerSmall,
    paramBox, statLabel, statValue,
    btnPrimarySmall
} from "@/lib/style";

// Scoped to this file — fixed width inputs suit the SettingRow right-hand slot
const textInput: React.CSSProperties = {
  width: 128, borderRadius: 6, border: `1px solid ${T.border}`,
  background: T.raised, padding: "6px 10px",
  fontSize: 12, fontFamily: "monospace", color: T.text, outline: "none",
};

const selInput: React.CSSProperties = {
  borderRadius: 6, border: `1px solid ${T.border}`,
  background: T.raised, padding: "6px 10px",
  fontSize: 12, fontFamily: "system-ui", color: T.text,
  outline: "none", cursor: "pointer",
};

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
        <div style={{ display: "grid", gridTemplateColumns: "0.4fr 1fr", gap: 16, alignItems: "start" }}>
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
                <SectionLabel label="Broker" first />

                <SettingRow label="Adapter" hint="SDK used to connect to a broker"
                    control={
                        <select value={broker.name}
                            onChange={e => ub("name", e.target.value)}
                            style={selInput}>
                            <option value="tiger">Tiger Trade</option>
                            <option value="csv">CSV (paper)</option>
                        </select>
                }/>

                <SettingRow label="Symbol" hint="Ticker on an exchange"
                    control={
                        <input value={broker.symbol}
                            onChange={e => ub("symbol", e.target.value)}
                            style={textInput}/>
                }/>
                
                <SettingRow label="Currency" hint="Settlement currency for this instrument"
                    control={
                        <input value={broker.currency}
                            onChange={e => ub("currency", e.target.value)}
                            style={textInput}/>
                }/>
                
                <SettingRow label="Exchange" hint="Exchange the security is listed on"
                control={
                    <input value={broker.exchange}
                    onChange={e => ub("exchange", e.target.value)}
                    style={textInput}/>
                }/>

                <SettingRow label="Lot size" hint="Minimum tradable quantity in shares"
                control={
                    <Stepper value={broker.lot_size}
                    onChange={v => ub("lot_size", v)}
                    min={1} step={100}/>
                }/>
               
                <SectionLabel label="Engine control" />
                
                <SettingRow label="Trading engine"
                    hint={running ? "Ticking every 10 mins during market hours" : "Stopped - no orders will be placed"}
                    control={
                        <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0 }}>
                            <div style={{ width:6, height:6, borderRadius:"50%",
                                background: running ? T.green : T.dim}}/>
                            <span style={{ fontSize:12, color:T.muted }}>
                                {running ? "Running" : "Stopped"}
                            </span>
                            <button onClick={toggle}
                                className={running ? btnDangerSmall : btnPrimarySmall}>
                                {running ? <><Square size={9}/>Stop</> : <><Play size={9}/>Start</>}
                            </button>
                        </div>
                    }/>
                
                {warn && (
                    <div style={{ marginTop:8, marginBottom:4, borderRadius:10, padding:14,
                        background:"rgba(255, 77, 106, 0.08)", border:"1px solid rgba(255, 77, 106, 0.2)"}}>
                        <div style={{ display:"flex", gap:10 }}>
                            <AlertTriangle size={13} color={T.amber} style={{ flexShrink:0, marginTop:2 }}/>
                            <div>
                                <div style={{ fontSize:12, fontWeight:500, color:T.amber, marginBottom:6 }}>
                                    Open position -- trailing stop will stop watching
                                </div>
                                <div style={{ fontSize:12, color:T.muted, lineHeight:1.6, marginBottom:12 }}>
                                    You hold{" "}
                                    <b style={{ color:T.text }}>{position?.qty.toLocaleString()} shares.</b>{" "}
                                    Place a resting broker-side stop order before stopping the engine.
                                </div>
                                <div style={{ display:"flex", gap:8 }}>
                                    <button onClick={forceStop} className={btnDangerSmall}>Stop anyway</button>
                                    <button onClick={() => setWarn(false)} className={btnSecondarySmall}>Cancel</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <SectionLabel label="Price cache" />

                {([
                    ["Cached bars", "1,247",                "Price bars stored in Postgres"           ],
                    ["Latest",      "Jun 14, 2026",         "Most recent cached bar date"             ],
                    ["Symbol",      "06066 · DAY",          "Symbol and interval stored"              ],
                    ["Adapter",     "CachedBrokerAdapter",  "Decorator wrapping TigerAdapter"         ],
                    
                ] as [string, string, string][]).map(([label, value, hint]) => (
                    <SettingRow key={label} label={label} hint={hint}
                        control={
                            <span style={{ fontSize:14, fontFamily:"monospace", fontWeight:600, color:T.text, flexShrink:0 }}>
                                {value}
                            </span>
                        }
                    />
                ))}

            </div>
        </div>
    );
}
