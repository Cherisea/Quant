import type { ReactNode } from "react";
import { T } from "@/lib/theme";

// Defines a contract of expected properties of a Field component
interface FieldProps { label: string, hint?: string; children: ReactNode; }

export default function Field({ label, hint, children}: FieldProps) {
    return (
        <div style={{ marginBottom: 11 }}>
            <div style={{ fontSize: 10, color: T.muted, marginBottom: 4, display: "flex", gap: 5, alignItems: "baseline"}}>
                <span style={{ fontWeight: 500}}>{label}</span>
                {hint && <span style={{ color: T.dim}}>{hint}</span>}
            </div>
            {children}
        </div>
    );
}