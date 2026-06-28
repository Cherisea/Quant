"use client";

import { T } from "@/lib/theme";
import { api } from "@/lib/api";
import { Check, Zap } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import SectionLabel from "@/components/ui/SectionLabel";
import { useTradingContext } from "@/context/TradingContext";
import { 
    btnPrimary, card, paramBox, statLabel, 
    statValue, badgeActive, badgePaused 
} from "@/lib/style";

export default function StrategyView() {
    const { strategy, setStrategy, risk, setRisk, running } = useTradingContext();
    const [saved, setSaved] = useState(false);

    // Simplifies field update of a state object
    const us = <O extends object>(setter: React.Dispatch<React.SetStateAction<O>>) => 
        (key: keyof O, value: O[keyof O]) => setter(prev => ({ ...prev, [key]: value }));

    // An asynchronous function to update strategy params
    const save = async () => {
        try { await api.updateStrategy({ strategy, risk }); } catch {}
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const metrics = [
        { label: "Win rate", value: "66.7%" },
        { label: "Sharpe", value: "1.82" },
        { label: "Max drawdown", value: "-7.84%" },
        { label: "Profit factor", value: "2.41" },
    ]

    return (
        <div style={{ display:"grid", gridTemplateColumns:"260px 1fr", gap:20, alignItems:"start" }}>

            {/* Left: overview card */}
            <div className={card}>
                <div className="p-4">
                    <div className="flex items-center gap-2.5 mb-4">
                        <div className="w-9 h-9 rounded-[10px] bg-[#1A1A2E] border border-[#252836]
                            flex items-center justify-center flex-shrink-0">
                            <Zap size={15} color={T.accent}/>
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">EMA Crossover</div>
                            <div className="text-[10px] text-[#7E839A] mt-0.5">Momentum strategy</div>
                        </div>
                    </div>
                    <span className={running ? badgeActive : badgePaused}>
                        {running ? "ACTIVE" : "PAUSED"}
                    </span>
                </div>

                <div className="border-t border-[#252836]"/>

                <div className="p-4">
                    <div className="text-[10px] font-semibold text-[#7E839A] uppercase tracking-[0.1em] mb-3">
                        Live performance
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {metrics.map(m => (
                            <div key={m.label} className={paramBox}>
                                <div>{m.label}</div>
                                <div>{m.value}</div>
                            </div>
                        ))}
                    </div>
                </div>

                <div />

                <div>
                    <span>ⓘ</span>{" "}
                    Changes write to Redis and are applied at the start of the next engine tick.
                </div>
            </div>

            {/* Right: setting rows */}
            <SectionLabel label="Signal parameters" first/>

        </div>
    )

    
}