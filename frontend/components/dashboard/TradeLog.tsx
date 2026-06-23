"use client";

import { T } from "@/lib/theme";
import { useTradingContext } from "@/context/TradingContext";

const REASON_STYLE: Record<string, { bg: string; color: string}> = {
    signal: {bg: "#DCFCE7", color: T.green},
    trail_stop: { bg:"#FEE2E2", color:T.red},
    open:       { bg:"#FEF9C3", color:T.amber },
    end_of_data:{ bg:"#F1F5F9", color:T.muted },
}

export default function TradeLog() {
    const { trades } = useTradingContext();

    return (
        <div style={{ background: T.card, border: `1px solid ${T.border}`,
            borderRadius:14, overflow:"hidden"}}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11, fontFamily: "monospace"}}>
                <thead>
                    <tr>{["Entry", "Exit", "Qty", "Buy", "Sell", "Net P&L", "%", "Reason"].map(h => (
                        <th key={h} style={{ padding: "6px 10px", textAlign: "left", color: T.muted, fontWeight: 400,
                            borderBottom: `1px solid ${T.border}`, fontSize: 9, textTransform: "uppercase",
                            letterSpacing: ".05em"
                        }}> {h}
                        </th>
                    ))}
                    </tr>
                </thead>

                <tbody>
                    {[...trades].reverse().map(t => {
                        const rs = REASON_STYLE[t.reason] ?? REASON_STYLE.end_of_data;

                        return (
                            <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                                <td style={{ padding:"7px 10px", color:T.muted }}>{t.entry}</td>
                                <td style={{ padding:"7px 10px", color:t.exit ? T.muted : T.amber }}>{t.exit ?? "OPEN"}</td>
                                <td style={{ padding:"7px 10px", color:T.text }}>{t.qty.toLocaleString()}</td>
                                <td style={{ padding:"7px 10px", color:T.text }}>{t.buy.toFixed(2)}</td>
                                <td style={{ padding:"7px 10px", color:T.text }}>{t.sell?.toFixed(2) ?? "—"}</td>
                                <td style={{ padding:"7px 10px", fontWeight:t.net !== null ? 500 : 400,
                                color: t.net === null ? T.muted : t.net >= 0 ? T.green : T.red }}>
                                {t.net === null ? "—" : `${t.net >= 0 ? "+" : ""}${t.net.toLocaleString()}`}
                                </td>
                                <td style={{ padding:"7px 10px", color: t.pct === null ? T.muted : t.pct >= 0 ? T.green : T.red }}>
                                {t.pct === null ? "—" : `${t.pct >= 0 ? "+" : ""}${t.pct.toFixed(2)}%`}
                                </td>
                                <td style={{ padding:"7px 10px" }}>
                                <span style={{ fontSize:9, padding:"2px 6px", borderRadius:3, ...rs }}>{t.reason}</span>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    )
}