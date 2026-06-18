"use client";

import { T } from "@/lib/theme";


const REASON_STYLE: Record<string, { bg: string; color: string}> = {
    signal: {bg: "#DCFCE7", color: T.green},
    trail_stop: { bg:"#FEE2E2", color:T.red},
    open:       { bg:"#FEF9C3", color:T.amber },
    end_of_data:{ bg:"#F1F5F9", color:T.muted },
}

export default function TradeLog() {
    
}