"use client";

import Link from "next/link";
import { Zap, MoreHorizontal, Plus } from "lucide-react";
import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { useMemo } from "react";
import Sparkline from "./Sparkline";

// Synthetic data for drawing a spark line background
function generateStrategySpark() {
    return Array.from({ length: 30}, (_, i) => ({
        v: 100 + Math.sin(i * 0.5) * 6 + i * 1.2 + Math.sin(i * 1.8) * 2.5,
    }));
}

function StrategyCard() {
    const { strategy, risk, running } = useTradingContext();
    const spark = useMemo(() => generateStrategySpark(), []);

    const params = [
        { label: "EMA", value: `${strategy.fast_ema}/${strategy.slow_ema}`},
        { label: "ROC", value: `${(strategy.roc_threshold * 100).toFixed(1)}%`},
        { label: "Vol filter", value: `${strategy.vol_coefficient}x`},
        { label: "Stop loss", value: `${(risk.stop_loss_pct * 100).toFixed(0)}%`},
    ];

    // Replace with real values from backend
    const metrics = [
        { label: "Win rate", value: "66.7%", color: T.green},
        { label: "Sharpe", value: "1.82%", color: T.text},
        { label: "Max DD", value: "-7.84%", color: T.red},
    ];

    return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column"}}>
            <div style={{ padding: "16px 16px 12px"}}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", 
                    justifyContent: "space-between", marginBottom: 14}}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10}}>
                        <div style={{ width: 38, height: 38, borderRadius: 10, background: "#1A1A2E",
                            border: `1px solid ${T.border}`, display: "flex", alignItems: "center",
                            justifyContent: "center"}}>
                            <Zap size={16} color={T.accent} />
                        </div>
                        <div>
                            <div style={{fontSize:13, fontWeight:500, color:T.text}}>EMA Crossover</div>
                            <div style={{fontSize:10, color:T.muted, marginTop:2}}>06066 · Momentum strategy</div>
                        </div>
                    </div>
                    <div>
                        <span style={{ fontSize:9, fontWeight:700, letterSpacing:"0.06em",
                            background: running ? "rgba(0, 212, 106, 0.12)" : T.raised,
                            color: running ? T.green : T.muted,
                            padding: "3px 7px", borderRadius: 4}}>
                            {running ? "ACTIVE" : "PASUED"}
                        </span>
                        <Link href="/strategy">
                            <MoreHorizontal size={14} color={T.dim} style={{ cursor: "pointer" }}/>
                        </Link>
                    </div>
                </div>

                {/* Params */}
                <div>
                    {params.map(p => (
                        <div key={p.label} style={{ background:T.raised, borderRadius:8, padding:"8px 10px"}}>
                            <div style={{ fontSize:9, color:T.muted, marginBottom:3,
                                textTransform:"uppercase", letterSpacing:"0.05em"}}>{p.label}
                            </div>
                            <div style={{ fontSize:13, fontWeight:600, color:T.text, fontFamily:"monospace"}}></div>
                        </div>
                    ))}
                </div>

                {/* Metrics */}
                <div style={{ display: "flex", gap: 20}}>
                    {metrics.map(m => (
                        <div key={m.label}>
                            <div style={{ fontSize:9, color:T.muted, marginBottom:2, textTransform:"uppercase",
                                letterSpacing: "0.05em"}}>
                                {m.label}
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 600, color: m.color, fontFamily:"monospace"}}>
                                {m.value}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ marginTop:"auto" }}>
                <Sparkline data={spark} color={T.accent} height={56}/>
            </div>
        </div>
    );
}

export default function StrategySection() {
    return (
        <div>
            <StrategyCard />
        </div>
    )
}