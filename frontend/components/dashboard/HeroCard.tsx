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
            <polygon
                points="0,200 60,78 122,118 182,48 244,95 304,32 364,82 424,42 484,68 520,52 520,200"
                fill="#122B26"/>
            <polygon
                points="0,200 42,142 94,158 154,108 214,142 274,96 334,132 394,86 454,118 520,82 520,200"
                fill="#0D2120"/>
            <polygon points={`${treeLine} 520,200 0,200`} fill="#091815"/>
            <circle cx="432" cy="42" r="20" fill="#152924"/>
            <circle cx="439" cy="37" r="16" fill="#0D1F1D"/>
            {stars.map(([cx, cy], i) => (
                <circle key={i} cx={cx} cy={cy} r={i % 3 === 0 ? 1.5 : 1} 
                fill="white" opacity={0.35 + (i % 3) * 0.15}/>
            ))}

            {/* Highlight dot -- echoes the chart's active point */}
            <circle cx="390" cy="88" r="4"  fill="#00D46A"/>
            <circle cx="390" cy="88" r="10" fill="#00D46A" opacity="0.15"/>
        </svg>
    );
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


