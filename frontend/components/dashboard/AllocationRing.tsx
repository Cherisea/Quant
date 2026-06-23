"use client";

import {T} from "@/lib/theme";

export default function AllocationRing() {
    return (
        <div style={{ background:T.card, border: `1px solid ${T.border}`,
            borderRadius:14, padding:18, display:"flex", flexDirection:"column"}}>
            <div >Allocation</div>
        </div>
    )
}