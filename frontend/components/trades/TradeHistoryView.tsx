"use client"

import Link from "next/link";
import {T} from "@/lib/theme";
import { ArrowLeft } from "lucide-react";
import { useTradingContext } from "@/context/TradingContext";

const REASON_STYLE: Record<string, { bg: string; color: string }> = {
  signal:      { bg:"rgba(0,212,106,0.1)",  color:T.green },
  trail_stop:  { bg:"rgba(255,77,106,0.1)", color:T.red   },
  open:        { bg:"rgba(255,184,0,0.1)",  color:T.amber },
  end_of_data: { bg:T.raised,               color:T.muted },
};


function Section({ children} : { children : React.ReactNode}) {
    return (
        <div style={{ fontSize:11, fontWeight:600, letterSpacing:"0.1em",
            textTransform:"uppercase", color:T.muted, marginBottom:12}}>
            {children}
        </div>
    )
}

export default function TradeHistoryView({ symbol } : {symbol:string}) {
    const { trades } = useTradingContext();
    const filtered = trades.filter(t => !symbol || t.reason !== undefined);
    const totalNet = filtered.reduce((s, t) => s + (t.net ?? 0), 0);
    const winners = filtered.filter(t => (t.net ?? 0) > 0);
    const winRate = filtered.length > 0 ? (winners.length / filtered.length) * 100 : 0;

    return (
        <div style={{ padding: "22px 24px"}}>
            {/* Back link */}
            <Link href="/" style={{ display:"inline-flex", alignItems:"center", gap:6,
                color:T.muted, fontSize:12, marginBottom:20, textDecoration:"none"
            }}>
                <ArrowLeft size={13}/>Back to dashboard
            </Link>

            {/* Header */}
            <div style={{ marginBottom:24 }}>
                <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:4 }}>
                    <h1 style={{ fontSize:22, fontWeight:600, color:T.text, margin:0 }}>
                        {symbol}
                    </h1>
                    <span style={{ fontSize:13, color:T.muted }}>Trade history</span>
                </div>
                <div style={{ fontSize:11, color:T.dim }}>HKEX · All completed and open trades</div>
            </div>

            {/* Summary cards */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:26}}>
                {[
                    {label:"Total trades", value:String(filtered.length), color:T.text},
                    {label:"Net P&L", 
                     value:`HK$${totalNet >= 0 ? "+" : ""}${totalNet.toLocaleString(undefined, {maximumFractionDigits:0})}`,
                     color: totalNet >= 0 ? T.green : T.red
                    },
                    {label:"Win rate", value:`${winRate.toFixed(1)}%`, color:T.text},
                    {label:"Symbol", value:symbol, color:T.text},
                ].map(c => (
                    <div key={c.label} style={{ background:T.card, border:`1px solid ${T.border}`,
                         borderRadius:10, padding:"14px 16px" }}>
                        <div style={{ fontSize:10, color:T.muted, textTransform:"uppercase",
                            letterSpacing:"0.06em", marginBottom:6}}>
                            {c.label}
                        </div>
                        <div style={{ fontSize:18, fontWeight:700, color:c.color, fontFamily:"monospace"}}>{c.value}</div>
                    </div>
                ))}
            </div>

            {/* Trade table */}
            <Section>All trades</Section>
            <div style={{ background:T.card, border:`1px solid ${T.border}`, borderRadius:14, overflow:"hidden"}}>
                <table style={{ width:"100%", borderCollapse:"collapse", fontSize:12, fontFamily:"monospace"}}>
                    <thead>
                        <tr style={{ borderBottom:`1px solid ${T.border}` }}>
                            {["Entry", "Exit", "Qty", "Buy", "Sell", "Net P&L", "Return", "Reason"].map(h => (
                                <th key={h} style={{ padding:"11px 16px", textAlign:"left",
                                    color:T.dim, fontWeight:500, fontSize:10,
                                    letterSpacing:"0.07em", textTransform:"uppercase"
                                }}>{h}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {[...filtered].reverse().map( trade => {
                            const rs = REASON_STYLE[trade.reason] ?? REASON_STYLE.end_of_data;
                            return (
                                <tr key={trade.id} style={{borderBottom:`1px solid ${T.border}`}}>
                                    <td style={{ padding:"11px 16px", color:T.muted}}>{trade.entry}</td>
                                    <td style={{ padding:"11px 16px", color:trade.exit ? T.muted:T.amber}}>{trade.exit ?? "OPEN"}</td>
                                    <td style={{ padding:"11px 16px", color:T.text}}>{trade.qty.toLocaleString()}</td>
                                    <td style={{ padding:"11px 16px", color:T.text}}>{trade.buy.toFixed(2)}</td>
                                    <td style={{ padding:"11px 16px", color:T.text}}>{trade.sell?.toFixed(2) ?? "-"}</td>
                                    <td style={{ padding:"11px 16px", fontWeight:500,
                                        color:trade.net === null ? T.muted : trade.net >= 0 ? T.green : T.red}}>
                                            {trade.net === null ? "-" : `${trade.net >=0 ? "+" : ""}${trade.net.toLocaleString()}`}
                                    </td>
                                    <td style={{ padding:"11px 16px",
                                        color: trade.pct === null ? T.muted : trade.pct >= 0 ? T.green : T.red}}>
                                            {trade.pct === null ? "-" : `${trade.pct >= 0 ? "+":""}${trade.pct.toLocaleString()}`}
                                    </td>
                                    <td style={{ padding:"11px 16px"}}>
                                        <span style={{ padding:"3px 8px", borderRadius:4,
                                                fontWeight:700, ...rs }}>
                                            {trade.reason}
                                        </span>
                                    </td>
                                    <td></td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

        </div>
    );
}