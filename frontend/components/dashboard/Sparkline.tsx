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
    
    
}