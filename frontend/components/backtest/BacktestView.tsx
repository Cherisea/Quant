"use client";

import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import { BT_STATS, generateBtEquity } from "@/data/seed";
import { Play, RefreshCw } from "lucide-react";
import { select, btnPrimary } from "@/lib/style";
import { CartesianGrid, ResponsiveContainer, LineChart, Line, XAxis, Tooltip, YAxis } from "recharts";

function BtTooltip({ active, payload}: any) {
    if (!active || !payload?.length) return null;
    const fmtEq = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : `${(v/1e3).toFixed(0)}K`;
    return (
        <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:5, padding:"7px 10px", fontSize:10 }}>
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
    const pollRef = useRef<ReturnType<typeof setInterval>>();

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
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: 16, alignItems: "start" }}>
            {/* Config */}
            <Card title="Configuration">
                <Field label="Test duration">
                    <select value={dur} onChange={e => setDur(+e.target.value)} className={select}>
                        {[1, 2, 3, 5].map(v => <option key={v} value={v}>{v} year{v>1?"s": ""}</option>)}
                    </select>
                </Field>

                <div style={{ margin:"12px 0", padding:10, background:T.elevated, borderRadius:6, fontSize:10, color:T.muted, lineHeight:1.75 }}>
                    EMA {strategy.fast_ema}/{strategy.slow_ema} · ROC {(strategy.roc_threshold*100).toFixed(0)}%
                    ({strategy.roc_period}d) · Vol {strategy.vol_coefficient}×MA({strategy.vol_ma})
                </div>

                <button onClick={run} disabled={busy} className={btnPrimary} style={{ width: "100%", justifyContent: "center" }}>
                    {busy 
                        ? <><RefreshCw size={11} style={{ animation: "spin 1s linear infinite" }}/> Running </>
                        : <><Play size={11}/> Run Backtest</>
                    }
                </button>
            </Card>

            {/* Results */}
            <div>
                {/* Default view */}
                {!done && !busy && (
                    <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background: T.surface, border: `1px dashed ${T.border}`, borderRadius: 8, color: T.muted}}>
                        <div style={{ fontSize:28, opacity:.15, marginBottom:10 }}>📊</div>
                        <div style={{ fontSize:12 }}>Configure and run a backtest</div>
                    </div>
                )}
                
                {/* A view when request is being processed */}
                {busy && (
                    <div style={{ height: 280, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        background:T.surface, border: `1px dashed ${T.border}`, borderRadius: 8}}>
                            <div style={{ width: 220, marginBottom: 12 }}>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.muted, marginBottom: 5}}>
                                    <span>Simulating {dur}-year dataset</span>
                                    <span style={{ fontFamily: "monospace"}}>{Math.round(prog)}</span>
                                </div>
                                <div style={{ height: 3, background: T.elevated, borderRadius: 2}}>
                                    <div style={{ height: "100%", width: `${prog}%`, background: T.accent, borderRadius: 2, transition: "width .15s"}}/>
                                </div>
                            </div>
                            <div style={{ fontSize: 10, color: T.dim}}>Bar-by-bar with slippage + fees...</div>
                    </div>
                )}

                {/* Final view after receiving results */}
                {done && (
                    <>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1r)", gap: 8, marginBottom: 14 }}>
                            {BT_STATS.map(([k, v, pos]) => (
                                <div key={k} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, padding: "9px 12px"}}>
                                    <div style={{ fontSize: 9, color: T.muted, textTransform: "uppercase", 
                                                    letterSpacing: ".05em", marginBottom: 2}}>{k}</div>
                                    <div style={{ fontSize: 14, fontWeight: 600, fontFamily: "monospace",
                                                    color: pos === null ? T.text : pos ? T.green : T.red}}>{v}</div>
                                </div>
                            ))}
                        </div>

                        <Card title="Strategy vs buy & hold">
                                <div style={{ height: 190 }}>
                                    <ResponsiveContainer>
                                        <LineChart data={btData} margin={{ top: 4, right: 4, bottom: 0, left: 0}}>
                                            <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                                            <XAxis dataKey="date" tick={{ fontSize: 8, fill:T.muted}} axisLine={false} tickLine={false} interval={18}/>
                                            <YAxis tick={false} axisLine={false} tickLine={false} domain={["auto", "auto"]} />
                                            <Tooltip content={<BtTooltip/>}/>
                                            <Line type="monotone" dataKey="strat" stroke={T.accent} strokeWidth={1.5} dot={false}/>
                                            <Line type="monotone" dataKey="bnh"   stroke={T.dim}    strokeWidth={1}   dot={false} strokeDasharray="4 4"/>
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}