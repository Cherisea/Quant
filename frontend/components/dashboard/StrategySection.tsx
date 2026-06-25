"use client";

import Link from "next/link";
import { Zap, MoreHorizontal, Plus } from "lucide-react";
import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { useMemo } from "react";

// Synthetic data for drawing a spark line background
function generateStrategySpark() {
    return Array.from({ length: 30}, (_, i) => ({
        v: 100 + Math.sin(i * 0.5) * 6 + i * 1.2 + Math.sin(i * 1.8) * 2.5,
    }));
}

function StrategyCard() {
    const { strategy, risk, running } = useTradingContext();
    const spark = useMemo(() => generateStrategySpark(), []);

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
            </div>
        </div>
    )
}

export default function StrategySection() {
    return (
        <div>
            <StrategyCard />
        </div>
    )
}