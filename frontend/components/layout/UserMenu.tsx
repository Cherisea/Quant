"use client";

import { useState, useRef, useEffect } from "react";
import { T } from "@/lib/theme";
import Link from "next/link";
import { Settings, LogOut, User, ChevronDown, ChevronUp } from "lucide-react";

// Dropdown menu on user avatar
const MENU_ITEMS = [
    {label: "Settings", href: "/settings", Icon: Settings},
    {label: "Profile", href: "/profile", Icon: User},
    {label: "Sign out", href: "/", Icon: LogOut},
] as const;

export default function UserMenu() {
    const [ open, setOpen ] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} style={{ position:"relative", display:"flex", gap:4, alignItems:"center"}}>
            {/* Avatar trigger */}
            <button
                onClick={() => setOpen(o => !o)}
                style={{ width:25, height:25, borderRadius:"50%", background:T.accent,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:13, fontWeight:600, color:"#000", cursor:"pointer",
                border:"none", flexShrink:0,
                outline: open ? `2px solid ${T.accent}` : "none",
                outlineOffset: 2
                }}>J
            </button>
            {open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}

            {/* Dropdown */}
            {open && (
                <div style={{
                    position:"absolute", top:"40px", right:-10,
                    background:T.card, border:`1px solid ${T.border}`,
                    borderRadius:10, padding:"6px 0", minWidth:100,
                    zIndex:100, boxShadow:"0 8px 24px rgba(0,0,0,0.4)",
                }}>
                    {MENU_ITEMS.map(({ label, href, Icon }) => (
                        <Link key={label} href={href} onClick={() => setOpen(false)} style={{
                            display:"flex", alignItems:"center", gap:10,
                            padding:"9px 14px", color:T.muted, fontSize:13,
                            textDecoration:"none"
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.raised)}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}>
                            <Icon size={14} />
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </div>
    )
}