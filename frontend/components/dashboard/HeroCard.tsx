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

    // Randomly sprinked stars in landscape background
    const stars = [[72,28],[148,18],[226,38],[320,14],[462,24],[498,50],[38,52],[184,44]] as const;

    return (
        <svg viewBox="0 0 520 200" preserveAspectRatio="xMidYMid slice"
            style={{ position: "absolute", inset:0, width: "100%", height: "100%"}}
            aria-hidden="true">
            <rect width="520" height="200" fill="#0D1F1D"/>
        </svg>
    )

}

export default function HeroCard() {
    return (
        <div style={{
            borderRadius:14, overflow:"hidden", position:"relative",
            background:T.card, border:`1px solid ${T.border}`, minHeight:210,
            }}>
            <Landscape />



        </div>
    )
}


