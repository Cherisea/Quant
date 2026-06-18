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
                        <NumInput  value={strategy.fast_ema} onChange={v => us(setStrategy)("fast_ema", v)} min={2} max={50}/>
                    </Field>

                    <Field label="Slow EMA" hint="periods">
                        <NumInput  value={strategy.slow_ema} onChange={v => us(setStrategy)("slow_ema", v)} min={10} max={200}/>
                    </Field>

                    <Field label="ROC period" hint="days">
                        <NumInput value={strategy.roc_period} onChange={v => us(setStrategy)("roc_period", v)} min={2} max={60}/>
                    </Field>

                    <Field label="Volume MA window" hint="days">
                        <NumInput value={strategy.vol_ma} onChange={v => us(setStrategy)("vol_ma", v)} min={5} max={60}/>
                    </Field>

                    <Field label="ROC threshold" hint={`${(strategy.roc_threshold*100).toFixed(1)}% min`}>
                        <input type="range" min={0.5} max={10} step={0.5} value={strategy.roc_threshold*100}
                        onChange={e => us(setStrategy)("roc_threshold", +e.target.value/100)}
                        style={{ width:"100%", accentColor:T.accent }}/>
                    </Field>

                    <Field label="Volume coefficient" hint={`${strategy.vol_coefficient.toFixed(1)}× avg`}>
                        <input type="range" min={1} max={3} step={0.1} value={strategy.vol_coefficient}
                        onChange={e => us(setStrategy)("vol_coefficient", +e.target.value)}
                        style={{ width:"100%", accentColor:T.accent }}/>
                    </Field>
                </Card>
            </div>
        </>
    )

    
}