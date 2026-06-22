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