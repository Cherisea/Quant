"use client";

import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { useState, useMemo, useRef } from "react";
import { api } from "@/lib/api";
import { BT_STATS, generateBtEquity } from "@/data/seed";

const selectStyle = {
    width: "100%", boxSizing: "border-box" as const, background: T.elevated,
    border: `1px solid ${T.border}`, borderRadius: 6, color: T.text, padding: "7px 10px",
    fontSize: 12, fontFamily: "system-ui", outline: "none"
};

const btnPrimary = { 
    display:"inline-flex", alignItems:"center", gap:5, padding:"7px 14px",
    borderRadius:6, border:"none", fontSize:12, fontWeight:500, cursor:"pointer",
    background:T.accent, color:"#fff" 
} as const;

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

    
}