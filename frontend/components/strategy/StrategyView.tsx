"use client";
import { T } from "@/lib/theme";


// Defines a primary style for a botton
const btnPrimary = {
    display: "inline-flex", alignItem: "center", gap: 5, padding: "7px 14px",
    borderRadius: 6, border: "none", fontSize: 12, fontWeight: 500, 
    cursor: "pointer", background: T.accent, color: "#fff"
} as const;