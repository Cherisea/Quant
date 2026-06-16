"use client";
import { useTradingContext } from "@/context/TradingContext";

function Divider() {
    return <div style={{ width:1, height:24, background: "white", flexShrink:0 }} />;
}

export default function StatusBar() {
    const { price, position } = useTradingContext();

}