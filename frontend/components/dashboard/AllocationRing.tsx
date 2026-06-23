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
        {name: "Cash", value: cashPercent, fill: T.raised},
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
                </div>
            </div>
        </div>
    )
}