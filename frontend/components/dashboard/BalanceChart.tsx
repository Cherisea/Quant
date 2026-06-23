"use client";

import { useMemo } from "react";
import { useTradingContext } from "@/context/TradingContext";
import { T } from "@/lib/theme";
import { ArrowUpRight } from "lucide-react";
import {
    AreaChart, Area, XAxis, YAxis,
    ResponsiveContainer, Tooltip,
} from "recharts";

// Generate synthetic data for plotting equity curve
function generateEquityData() {
    let v = 500_000;
    return Array.from({ length: 60 }, (_, i) => {
        v = Math.max(v * (1 + 0.003 + (Math.sin(i * 0.7) * 0.5 - 0.25) * 0.018), 400_000);
        return { i, v: Math.round(v) };
    })
}

export default function BalanceChart() {
    const { price, position } = useTradingContext();
    const data = useMemo(() => generateEquityData(), []); 

    const qty = position?.qty ?? 0;
    const entryPrice = position?.entry_price ?? 0;
    const cashBalance = 511_173;
    const portfolio = cashBalance + qty * price;
    const dailyGain = qty > 0 ? (price - entryPrice) * qty : 0;

    return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
            borderRadius: 14, padding: "16px 16px 0"}}>
            <div style={{ display: "flex", justifyContent: "space-between",
                alignItems: "flex-start", marginBottom: 6}}>
                <div style={{ fontSize: 12, color: T.muted}}>Portfolio equity</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4,
                    background: "rgba(0, 212, 106, 0.1)", borderRadius: 5, padding: "3px 8px"}}>
                    <ArrowUpRight size={10} color={T.green} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: T.green}}>
                        Today {dailyGain >= 0 ? "+" : ""}HK${Math.abs(dailyGain).toLocaleString(undefined, { maximumFractionDigits: 0})}
                    </span>
                </div>
            </div>

            <div style={{ fontSize: 24, fontWeight: 700, color: T.text,
                fontFamily: "monospace", marginBottom: 12}}>
                HK${(portfolio / 1000).toFixed(1)}K
            </div>

            <div style={{ height: 118 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="balance-fill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor={T.green} stopOpacity={0.25} />
                                <stop offset="95%" stopColor={T.green} stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <XAxis dataKey="i" hide/>
                        <YAxis hide domain={["auto", "auto"]}/>
                        <Area 
                            type = "monotone" dataKey="v"
                            stroke = {T.green} strokeWidth = {1.8}
                            fill = "url{#balance-fill}" dot = {false}
                            activeDot = {{ r: 4, fill:T.green, strokeWidth: 0 }}/>
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}