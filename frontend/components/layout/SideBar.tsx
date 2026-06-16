"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, BarChart2, Zap, Settings, TrendingUp, Wifi, WifiOff } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";
import {T} from "@/lib/theme";