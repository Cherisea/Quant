/**
 * A fixed side bar for navigating to different subpages.
 * 
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart2, Zap, Settings, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";

// Four sidebar links to other pages
const NAV = [
    { href: "/", label: "Dashboard", Icon:Activity},
    { href: "/backtest", label: "Backtest", Icon: BarChart2},
    { href: "/strategy", label: "Strategy", Icon: Zap},
    { href: "/settings", label: "Settings", Icon: Settings},
] as const;

export default function SideBar() {
    const pathname = usePathname();
    const { running, wsConnected } = useTradingContext();

    return (
        <aside style={{
            width:200, display:"flex", flexDirection:"column",
            background:T.card, borderRight:`1px solid ${T.border}`, flexShrink:0,
        }}>
            {/* Nav links */}
            <nav style={{ flex:1, padding:"6px 0" }}>
                {NAV.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                    <Link key={href} href={href} style={{
                        display:"flex", alignItems:"center", gap:9, padding:"8px 14px",
                        background: active ? T.raised : "transparent",
                        color:       active ? T.text    : T.muted,
                        borderLeft:  `2px solid ${active ? T.accent : "transparent"}`,
                        fontSize:13, fontWeight: active ? 500 : 400,
                        textDecoration: "none",
                        }}>
                    <Icon size={14}/>{label}
                    </Link>
                );
                })}
            </nav>
            
            {/* Engine status */}
            <div style={{ padding:"12px 16px", borderTop:`1px solid ${T.border}`, fontSize:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                <div style={{ width:5, height:5, borderRadius:"50%",
                    background: running ? T.green : T.red,
                    animation: running ? "pulse 2s infinite" : "none" }}/>
                <span style={{ color:T.muted }}>{running ? "Engine running" : "Engine stopped"}</span>
                </div>
            </div>

        </aside>
    )
}