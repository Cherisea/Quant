"use client";

import { T } from "@/lib/theme";
import { api } from "@/lib/api";
import { Check } from "lucide-react";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Field from "@/components/ui/Field";
import NumInput from "@/components/ui/NumInput";
import { useTradingContext } from "@/context/TradingContext";
import { 
    btnPrimary, card, paramBox, statLabel, 
    statValue, badgeActive, badgePaused 
} from "@/lib/style";

export default function StrategyView() {
    const { strategy, setStrategy, risk, setRisk } = useTradingContext();
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
        <div>
            
        </div>
    )

    
}