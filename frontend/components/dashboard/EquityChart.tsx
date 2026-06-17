"use client";

import { T } from "@/lib/theme";
import { useMemo } from "react";
import Card from "@/components/ui/Card";
import { generateEquityCurve } from "@/data/seed";
import { ResponsiveContainer, AreaChart, XAxis, YAxis, 
    CartesianGrid, Tooltip, Area, ReferenceLine } from "recharts";

// Convert large numbers to human-readable format
const fmtEq = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : `${(v/1e3).toFixed(0)}K`;

function ChartTooltip({ active, payload }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:5, padding:"7px 10px", fontSize:11 }}>
            <div style={{ color:T.muted }}>{payload[0].payload.date}</div>
            <div style={{ color:T.text, fontFamily:"monospace", fontWeight:500 }}>HK${fmtEq(payload[0].value)}</div>
        </div>
    )
}

export default function EquityChart() {
    const data = useMemo(() => generateEquityCurve(), []);

    return (
        <Card title="Equity curve" sub={`HKD · ${data.length} trading days · initial HK$500K`} style={{ marginBottom:14 }}>
            <div style={{ height: 200 }}>
                <ResponsiveContainer>
                    <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                        <defs>
                            <linearGradient id="eq-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%"  stopColor={T.accent} stopOpacity={0.15}/>
                                <stop offset="95%" stopColor={T.accent} stopOpacity={0}/>
                            </linearGradient>
                        </defs>

                        <CartesianGrid strokeDasharray="3 3" stroke={T.border}/>
                        <XAxis dataKey="date" tick={false} axisLine={false} tickLine={false}/>
                        <YAxis tick={false} axisLine={false} tickLine={false} domain={["auto","auto"]}/>
                        <Tooltip content={<ChartTooltip/>}/>
                        <ReferenceLine y={500000} stroke={T.dim} strokeDasharray="4 4"/>
                        <Area type="monotone" dataKey="equity" stroke={T.accent} strokeWidth={1.5} fill="url(#eq-gradient)" dot={false}/>
                    </AreaChart>
                </ResponsiveContainer>

            </div>
        </Card>
    );
}