"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart2, Zap, Settings, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";

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
            background:T.surface, borderRight:`1px solid ${T.border}`, flexShrink:0,
        }}>
            {/* Logo */}
            <div style={{ padding:"16px 14px 14px", borderBottom:`1px solid ${T.border}` }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <div style={{ width:26, height:26, borderRadius:5, background:T.accent,
                    display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <TrendingUp size={12} color="#fff"/>
                </div>
                <div>
                    <div style={{ fontSize:12, fontWeight:600, color:T.text }}>MomentumBot</div>
                    <div style={{ fontSize:9, color:T.muted }}>06066 · HKEX · DAY</div>
                </div>
                </div>
            </div>

            {/* Nav links */}
            <nav style={{ flex:1, padding:"6px 0" }}>
                {NAV.map(({ href, label, Icon }) => {
                const active = pathname === href;
                return (
                    <Link key={href} href={href} style={{
                    display:"flex", alignItems:"center", gap:9, padding:"8px 14px",
                    background: active ? T.elevated : "transparent",
                    color:       active ? T.text    : T.muted,
                    borderLeft:  `2px solid ${active ? T.accent : "transparent"}`,
                    fontSize:12, fontWeight: active ? 500 : 400,
                    }}>
                    <Icon size={13}/>{label}
                    </Link>
                );
                })}
            </nav>

            {/* Engine + WS status */}
            <div style={{ padding:"10px 14px", borderTop:`1px solid ${T.border}`, fontSize:10 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5, marginBottom:4 }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:running?T.green:T.red,
                    animation: running?"pulse 2s infinite":"none" }}/>
                <span style={{ color:T.muted }}>{running?"Engine running":"Engine stopped"}</span>
                </div>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                {wsConnected
                    ? <Wifi    size={9} color={T.green}/>
                    : <WifiOff size={9} color={T.red}/>}
                <span style={{ color:T.muted }}>WS {wsConnected?"connected":"disconnected"}</span>
                </div>
            </div>

        </aside>
    )
}