"use client";

import { T } from "@/lib/theme";
import { api } from "@/lib/api";
import { Check } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import NumInput from "@/components/ui/NumInput";
import { useTradingContext } from "@/context/TradingContext";
import { btnPrimary } from "@/lib/style";

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

                {/* Risk settings */}
                <Card title="Risk settings" sub="Sizing · stops · execution">
                    <Field label="Position size" hint={`${(risk.trade_size_pct * 100).toFixed(0)}% of capital`}>
                        <input type="range" min={10} max={100} step={5} value={risk.trade_size_pct*100} 
                            onChange={e => us(setRisk)("trade_size_pct", +e.target.value/100)}
                            style={{ width: "100%", accentColor: T.accent }}/>
                    </Field>

                    <Field label="Trailing stop" hint={`${(risk.stop_loss_pct*100).toFixed(1)}% from peak`}>
                        <input type="range" min={1} max={15} step={0.5} value={risk.stop_loss_pct*100}
                        onChange={e => us(setRisk)("stop_loss_pct", +e.target.value/100)}
                        style={{ width:"100%", accentColor:T.accent }}/>
                    </Field>

                    <Field label="Limit buffer" hint="bps">
                        <NumInput value={risk.limit_buffer_bps} onChange={v => us(setRisk)("limit_buffer_bps", v)} min={1} max={50}/>
                    </Field>

                    <Field label="Order timeout" hint="seconds">
                        <NumInput value={risk.max_wait_sec} onChange={v => us(setRisk)("max_wait_sec", v)} min={10} max={300} step={10}/>
                    </Field>

                    <Field label="Lookback bars" hint="daily bars">
                        <NumInput value={risk.lookback_bars} onChange={v => us(setRisk)("lookback_bars", v)} min={60} max={600} step={10}/>
                    </Field>
                    <div style={{ marginTop:10, padding:"9px 10px", background:T.elevated, borderRadius:5, fontSize:10, color:T.muted, lineHeight:1.7 }}>
                        <span style={{ color:T.amber }}>ⓘ</span> Saving POSTs to <code>/api/strategy</code>, which writes to Redis. Engine picks up changes at next tick.
                    </div>
                </Card>
            </div>

            <div style={{ marginTop:16, display:"flex", justifyContent:"flex-end" }}>
                <button onClick={save} className={btnPrimary} style={{ minWidth:130, justifyContent:"center" }}>
                {saved ? <><Check size={11}/> Saved</> : "Save changes"}
                </button>
            </div>
        </>
    )

    
}