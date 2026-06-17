"use client";

// Convert large numbers to human-readable format
const fmtEq = (v: number) => v >= 1e6 ? `${(v/1e6).toFixed(2)}M` : `${(v/1e3).toFixed(0)}K`;

export default function EquityChart() {
    
}