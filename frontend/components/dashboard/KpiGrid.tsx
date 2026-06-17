import { KPI_SEED } from "@/data/seed";
import { T } from "@/lib/theme";

export default function KpiGrid() {
    return (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
            {KPI_SEED.map(k => (
                <div key={k.label} style={{
                background:T.surface, border:`1px solid ${T.border}`, borderRadius:7, padding:"11px 14px",
                }}>
                <div style={{ fontSize:9, color:T.muted, textTransform:"uppercase", letterSpacing:".05em", marginBottom:3 }}>
                    {k.label}
                </div>
                <div style={{ fontSize:17, fontWeight:600, fontFamily:"monospace",
                    color: (k as any).neu ? T.text : (k as any).pos ? T.green : T.red }}>
                    {k.value}
                </div>
                </div>
            ))}
        </div>
    );
}