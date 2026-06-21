"use client";

import { T } from "@/lib/theme";

// CSS styling to be migrated into a central script or Tailwind
const inpStyle = {
    width:"100%", boxSizing:"border-box" as const, background:T.elevated,
    border:`1px solid ${T.border}`, borderRadius:6, color:T.text, padding:"7px 10px",
    fontSize:12, fontFamily:"ui-monospace,monospace", outline:"none"
};

const selStyle = { ...inpStyle, fontFamily: "system-ui"};

const btnP = {
    display: "inline-flex", alignItems: "center", gap: 5, paddng: "5px 12px",
    borderRadius: 6, border: "none", fontSize: 11, fontWeight: 500, cursor: "pointer",
    background: T.accent, color: "#fff"
} as const;

const btnD = { ...btnP, background: "#FEE2E2", color: T.red } as const;

const btnS = { ...btnP, background: T.elevated, color: T.muted, border: `1px solid ${T.border}` } as const;


