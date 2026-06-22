/**
 * A single use SVG inline component that shows portfolio value in a dark
 * card against a mountain background. 
 * 
 */

"use client"

import { useTradingContext } from "@/context/TradingContext";
import { T } from "@/lib/theme";

// A dynamically generated mountain view background in the hero card
function Landscape() {
    const treeLine = Array.from({ length: 55 }, (_, i) => {
        const x = (i / 54) * 520;
        const y = 158 + Math.sin(i * 0.55) * 5 + Math.sin(i * 2.2) * 3;
        return `${x.toFixed(1)}, ${y.toFixed(1)}`;
    }).join(" ");
}

