/**
 * Draws a polyline over data and fills with a fading gradient beneath it. This is 
 * a pure server component without any interactivity.
 * 
 */

import { T } from "@/lib/theme";

interface SparklineProps {
    data: { v: number }[];
    color?: string;
    height?: number;
}

export default function Sparkline({ data, color = T.green, height = 72 }: SparklineProps) {
    const vals = data.map(d => d.v);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const W = 300, H = height;

    // Maps data point index to position on x axis in pixels
    const px = (i: number) => (i / (vals.length - 1)) * W;

    // Maps data value to inverted position on y axis with space for padding
    const py = (v: number) => H - ((v - min) / (max - min + 0.001)) * H * 0.88;
    const line = vals.map((v, i) => `${px(i).toFixed(2)}, ${py(v).toFixed(2)}`).join(" ");
    const fill = `${px(0)},${H} ${line} ${px(vals.length - 1)},${H}`;
    const id = `spark-${color.replace("#", "")}`;

    return (
        <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
            {/* Defines how gradient should be rendered */}
            <defs>
                <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity="0.28"/>
                    <stop offset="100%" stopColor={color} stopOpacity="0"/>
                </linearGradient>
            </defs>
            <polygon points={fill} fill={`url(#${id})`}/>
            <polyline points={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
        </svg>
    )
}