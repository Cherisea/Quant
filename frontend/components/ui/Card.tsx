import type { CSSProperties, ReactNode } from "react";
import { T } from "@/lib/theme";

interface CardProps {
    title: string;
    sub?: string;
    children: ReactNode;
    style?: CSSProperties;
}

export default function Card({ title, sub, children, style }: CardProps) {
    return (
        <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, overflow:"hidden", ...style }}>
            <div style={{ padding:"11px 16px", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ fontSize:12, fontWeight:500, color:T.text }}>{title}</div>
                {sub && <div style={{ fontSize:10, color:T.muted, marginTop:1 }}>{sub}</div>}
            </div>
            <div style={{ padding:"14px 16px" }}>{children}</div>
        </div>
    )
}