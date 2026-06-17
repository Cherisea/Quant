"use client";

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
    
}