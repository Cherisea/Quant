"use client";

import { T } from "@/lib/theme";
import { ArrowUpRight } from "lucide-react";

export default function BalanceChart() {

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
                        {}
                    </span>
                </div>
            </div>
        </div>
    )
}