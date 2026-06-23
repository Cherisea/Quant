"use client";

import { PieChart, Pie } from "recharts";
import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";

export default function AllocationRing() {
    const { price, position } = useTradingContext();
    const qty = position?.qty ?? 0;
    const cashBalance = 511_173;
    const posValue = qty * price;
    const total = cashBalance + posValue;
    const posPercent = total > 0 ? Math.round((posValue / total) * 100) : 0;
    const cashPercent = 100 - posPercent;

    const slices = [
        {name: "Position", value: posPercent, fill: T.green},
        {name: "Cash", value: cashPercent, fill: T.blue},
    ];


    return (
        <div style={{ background:T.card, border: `1px solid ${T.border}`,
            borderRadius:14, padding:18, display:"flex", flexDirection:"column"}}>
            <div style={{ fontSize:12, color:T.muted, marginBottom:12 }}>Allocation</div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1}}>
                <div style={{ position: "relative", width: 130, height: 130 }}>
                    <PieChart width={130} height={130}>
                        <Pie data={slices} cx={60} cy={60}
                            innerRadius={40} outerRadius={58}
                            dataKey="value" strokeWidth={0}
                            startAngle={90} endAngle={-270}>
                        </Pie>
                    </PieChart>
                    <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", flexDirection: "column",
                        alignItems: "center", justifyContent: "center"}}>
                        <div style={{ fontSize:20, fontWeight:700, color:T.text}}>{posPercent}%</div>
                        <div style={{ fontSize:9, color:T.muted}}>deployed</div>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ width: "100%", marginTop: 12 }}>
                    {slices.map(s => (
                        <div key={s.name} style={{ display: "flex", alignItems: "center",
                            justifyContent: "space-between", padding: "4px 0"}}>
                            <div style={{ display: "flex", alignItems: "center", gap: 7}}>
                                <div style={{ width: 7, height: 7, borderRadius: "50%", background:s.fill}}/>
                                <span style={{ fontSize: 12, color: T.muted}}>{s.name}</span>
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>
                                {s.value}%
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}