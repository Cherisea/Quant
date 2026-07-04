"use client";

import {T} from "@/lib/theme";
import { BarChart2 } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";
import { useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import { BT_STATS, generateBtEquity } from "@/data/seed";
import { Play, RefreshCw } from "lucide-react";
import { select, btnPrimary, paramBox, statLabel, statValue } from "@/lib/style";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, Tooltip, YAxis } from "recharts";

const DURATIONS = [1, 2, 3, 5] as const;
type Duration = typeof DURATIONS[number];

function BtTooltip({ active, payload}: any) {
    if (!active || !payload?.length) return null;
    const fmtEq = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : `${(v/1e3).toFixed(0)}K`;
    return (
        <div style={{ background:T.raised, border:`1px solid ${T.border}`, borderRadius:6, padding:"7px 10px", fontSize:10 }}>
            <div style={{ color:T.accent }}>Strategy: HK${fmtEq(payload[0]?.value)}</div>
            <div style={{ color:T.muted }}>B&H: HK${fmtEq(payload[1]?.value)}</div>
        </div>
    );
}

export default function BacktestView() {
    const { strategy } = useTradingContext();
    const [dur, setDur] = useState(3);
    const [busy, setBusy] = useState(false);
    const [prog, setProg] = useState(0);
    const [done, setDone] = useState(false);
    const btData = useMemo(() => generateBtEquity(), []);
    const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

    const run = async () => {
        setBusy(true); setProg(0); setDone(false);

        try {
            const { job_id } = await api.submitBacktest(dur);
            pollRef.current = setInterval(async () => {
                const job = await api.backtestStatus(job_id);
                setProg(job.progress ?? 0);
                if (job.status === "done") {
                    clearInterval(pollRef.current);
                    setDone(true);
                    setBusy(false);
                }
            }, 500);
        } catch {
            // API unreachable -- simulate locally
            let p = 0;
            const id = setInterval(() => {
                p += Math.random() * 15 + 3;
                if (p >= 100) { 
                    clearInterval(id); setProg(100); setDone(true); setBusy(false);
                } else setProg(p);
            }, 200);
        }
    };

    return (
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 20, alignItems: "start" }}>
            {/* Left: config panel */}
            <Card title="Configuration">
                {/* Duration - pill selector */}
                <div style={{ marginBottom:40 }}>
                    <div style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:"uppercase",
                        letterSpacing:"0.1em", marginBottom:8}}>Test duration</div>
                    <div style={{ display:"flex", gap:8 }}>
                        {DURATIONS.map(v => (
                            <button key={v} onClick={() => setDur(v)} style={{
                                flex:1, padding:"6px 0", borderRadius:6, border:"none",
                                cursor:"pointer", fontSize:12, fontWeight:500,
                                background: dur === v ? T.accent : T.border,
                                color: dur === v ? "#000" : T.muted,
                                transition: "background 0.15s, color 0.15s",
                            }}>
                                {v}yr
                            </button>
                        ))}
                    </div>
                </div>

                {/* Active strategy preview */}
                <div style={{ marginBottom:16 }}>
                <div style={{ fontSize:10, fontWeight:600, color:T.muted, textTransform:"uppercase",
                    letterSpacing:"0.1em", marginBottom:8 }}>Strategy</div>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
                    {[
                    { label:"Fast EMA", value:`${strategy.fast_ema}`                        },
                    { label:"Slow EMA", value:`${strategy.slow_ema}`                        },
                    { label:"ROC",      value:`${(strategy.roc_threshold*100).toFixed(0)}%` },
                    { label:"Vol",      value:`${strategy.vol_coefficient}×`                },
                    ].map(p => (
                    <div key={p.label} className={paramBox}>
                        <div className={statLabel}>{p.label}</div>
                        <div className={statValue}>{p.value}</div>
                    </div>
                    ))}
                </div>
                </div>

                <button onClick={run} disabled={busy} className={btnPrimary} style={{ width: "100%", justifyContent: "center" }}>
                    {busy 
                        ? <><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }}/> Running </>
                        : <><Play size={11}/> Run Backtest</>
                    }
                </button>
            </Card>

            {/* Right: results panel */}
            <div>
                {/* Idle */}
                {!done && !busy && (
                <div style={{ height:300, display:"flex", flexDirection:"column",
                    alignItems:"center", justifyContent:"center",
                    background:T.card, border:`1.5px dashed ${T.border}`,
                    borderRadius:14, color:T.muted }}>
                    <BarChart2 size={28} style={{ opacity:.18, marginBottom:10 }}/>
                    <div style={{ fontSize:12 }}>Configure and run a backtest</div>
                    <div style={{ fontSize:11, marginTop:3, color:T.dim }}>Results will appear here</div>
                </div>
                )}
                
                {/* A view when request is being processed */}
                {busy && (
                    <div style={{ height:300, display:"flex", flexDirection:"column",
                        alignItems:"center", justifyContent:"center",
                        background:T.card, border:`1px solid ${T.border}`, borderRadius:14 }}>
                        <div style={{ width:220, marginBottom:12 }}>
                        <div style={{ display:"flex", justifyContent:"space-between",
                            fontSize:11, color:T.muted, marginBottom:6 }}>
                            <span>Simulating {dur}-year dataset</span>
                            <span style={{ fontFamily:"monospace" }}>{Math.round(prog)}%</span>
                        </div>
                        <div style={{ height:3, background:T.raised, borderRadius:2 }}>
                            <div style={{ height:"100%", width:`${prog}%`, background:T.accent,
                            borderRadius:2, transition:"width .15s" }}/>
                        </div>
                        </div>
                        <div style={{ fontSize:11, color:T.dim }}>Bar-by-bar with slippage + fees…</div>
                    </div>
                )}

                {/* Final view after receiving results */}
                {done && (
                <>
                    <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)",
                    gap:8, marginBottom:14 }}>
                    {BT_STATS.map(([k, v, pos]) => (
                        <div key={k} className={paramBox}>
                        <div className={statLabel}>{k}</div>
                        <div className={statValue}
                            style={{ color: pos === null ? T.text : pos ? T.green : T.red }}>
                            {v}
                        </div>
                        </div>
                    ))}
                    </div>

                    <Card title="Strategy vs buy & hold">
                    <div style={{ height:190 }}>
                        <ResponsiveContainer>
                        <LineChart data={btData} margin={{ top:4, right:4, bottom:0, left:0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                            <XAxis dataKey="date" tick={{ fontSize:8, fill:T.muted }}
                            axisLine={false} tickLine={false} interval={18}/>
                            <YAxis tick={false} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
                            <Tooltip content={<BtTooltip/>}/>
                            <Line type="monotone" dataKey="strat" stroke={T.accent}
                            strokeWidth={1.5} dot={false}/>
                            <Line type="monotone" dataKey="bnh" stroke={T.dim}
                            strokeWidth={1} dot={false} strokeDasharray="4 4"/>
                        </LineChart>
                        </ResponsiveContainer>
                    </div>
                    <div style={{ display:"flex", gap:16, marginTop:8,
                        fontSize:11, color:T.dim }}>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ display:"inline-block", width:16, height:2,
                            background:T.accent }}/>Strategy
                        </span>
                        <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                        <span style={{ display:"inline-block", width:16, height:1,
                            borderTop:`1px dashed ${T.dim}` }}/>Buy & hold
                        </span>
                    </div>
                    </Card>
                </>
                )}
            </div>
        </div>
    )
}