/**
 * A page header component that applies a specific style to a header
 * and optional subtitle of a web page.
 * 
 */

import { T } from "@/lib/theme";

interface PageHeaderProps { title: string, sub?: string};

export default function PageHeader({ title, sub }: PageHeaderProps) {
    return (
        <div style={{ marginBottom: 20 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: T.text, margin: 0 }}>{title}</h1>
            {sub && <p style={{ fontSize: 11, color: T.muted, marginTop: 2, marginBottom: 0 }}>{sub}</p>}
        </div>
    )
}