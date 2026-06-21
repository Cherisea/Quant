"use client";

import { T } from "@/lib/theme";
import { useState } from "react";
import { api } from "@/lib/api";
import { useTradingContext } from "@/context/TradingContext";

// CSS styling to be migrated into a central script or Tailwind
const inpStyle = {
    width:"100%", boxSizing:"border-box" as const, background:T.elevated,
    border:`1px solid ${T.border}`, borderRadius:6, color:T.text, padding:"7px 10px",
    fontSize:12, fontFamily:"ui-monospace,monospace", outline:"none"
};

const selStyle = { ...inpStyle, fontFamily: "system-ui"};

const btnP = {
    display: "inline-flex", alignItems: "center", gap: 5, paddng: "5px 12px",
    borderRadius: 6, border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer",
    background: T.accent, color: "#fff"
} as const;

const btnD = { ...btnP, background: "#FEE2E2", color: T.red } as const;

const btnS = { ...btnP, background: T.elevated, color: T.muted, border: `1px solid ${T.border}` } as const;

export default function SettingsView() {
    const { running, setRunning, position } = useTradingContext();
    const [broker, setBroker] = useState({ name: "tiger", symbol: "06066", currency: "HKD", exchange: "HKEX", lot_size: 500 });
    const [warn, setWarn] = useState(false);

    // Turn on/off backtest engine
    const toggle = async () => {
        if (running && (position?.qty ?? 0) > 0) { setWarn(true); return; }
        try { running ? await api.engineStop() : await api.engineStart(); } catch {}
        setRunning(r => !r);
    };

    // Force stop backtest engine
    const forceStop = async () => {
        try { await api.engineStop(); } catch {}
        setRunning(false);
        setWarn(false);
    }

    
}
