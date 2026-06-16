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
    
}