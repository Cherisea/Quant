"use client";

import { Zap } from "lucide-react";
import {T} from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";
import { useMemo } from "react";

// Synthetic data for drawing a spark line background
function generateStrategySpark() {
    return Array.from({ length: 30}, (_, i) => ({
        v: 100 + Math.sin(i * 0.5) * 6 + i * 1.2 + Math.sin(i * 1.8) * 2.5,
    }));
}

function StrategyCard() {
    const { strategy, risk, running } = useTradingContext();
    const spark = useMemo(() => generateStrategySpark(), []);

    return (
        <div>
            <div>
                {/* Header */}
                <div>
                    <div>
                        <div>
                            <Zap size={16} color={T.accent} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default function StrategySection() {
    return (
        <div>
            <StrategyCard />
        </div>
    )
}