"use client";

import { useState } from "react";
import { T } from "@/lib/theme";
import { Settings, LogOut, User } from "lucide-react";

// Dropdown menu on user avatar
const MENU_ITEMS = [
    {label: "Settings", href: "/settings", Icon: Settings},
    {label: "Profile", href: "/profile", Icon: User},
    {label: "Sign out", href: "/", Icon: LogOut},
] as const;

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

            {/* Dropdown */}

        </div>
    )
}