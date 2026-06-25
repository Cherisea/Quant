"use client";

import { useState } from "react";
import { T } from "@/lib/theme";

export default function UserMenu() {
    const [ open, setOpen ] = useState(false);
    return (
        <div>
            {/* Avatar trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{ width:32, height:32, borderRadius:"50%", background:T.accent,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:600, color:"#000", cursor:"pointer",
                border:"none", flexShrink:0,
                outline: open ? `2px solid ${T.accent}` : "none",
                outlineOffset: 2
                }}>J
            </button>
        </div>
    )
}