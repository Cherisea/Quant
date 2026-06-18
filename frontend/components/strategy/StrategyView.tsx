"use client";

import { T } from "@/lib/theme";
import { api } from "@/lib/api";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import NumInput from "@/components/ui/NumInput";
import { useTradingContext } from "@/context/TradingContext";


// Defines a primary style for a botton
const btnPrimary = {
    display: "inline-flex", alignItem: "center", gap: 5, padding: "7px 14px",
    borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, 
    cursor: "pointer", background: T.accent, color: "#fff"
} as const;

export default function StrategyView() {
    const { strategy, setStrategy, risk, setRisk } = useTradingContext();
    const [saved, setSaved] = useState(false);

    // Simplifies field update of a state object
    const us = <T extends object>(setter: React.Dispatch<React.SetStateAction<T>>) => 
        (key: keyof T, value: T[keyof T]) => setter(prev => ({ ...prev, [key]: value }));

    // An asynchronous function to update strategy params
    const save = async () => {
        try { await api.updateStrategy({ strategy, risk }); } catch {}
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    return (
        <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16}}>
                {/* Signal settings */}
                <Card title="Signal settings" sub="Crossover · ROC · volume filter">
                    <Field label="Fast EMA" hint="periods">
                        <NumInput />
                    </Field>
                </Card>
            </div>
        </>
    )

    
}