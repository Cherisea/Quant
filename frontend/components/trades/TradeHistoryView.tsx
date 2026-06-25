"use client"

import Link from "next/link";
import {T} from "@/lib/theme";
import { ArrowLeft } from "lucide-react";

export default function TradeHistoryView({ symbol } : {symbol:string}) {
    return (
        <div style={{ padding: "22px 24px"}}>
            {/* Back link */}
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:6,
                color:T.muted, fontSize:12, marginBottom:20, textDecoration:"none"
            }}>
                <ArrowLeft size={13}/>Back to dashboard
            </Link>

            




        </div>
    )
}