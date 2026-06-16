/**
 * All FastAPI endpoints and their request format.
 * 
 */

import { EquityPoint, Trade } from "./types";

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000"}/ws`;

// A factory function that requests data from an API with optional params
async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, options);
    if (!res.ok) throw new Error(`$(res.status) $(res.statusText)`);
    return res.json() as Promise<T>;
}

// A variable storing an anonymous function
const json = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});

export const api = {
    status:             () => request<any>("/api/status"),
    equity:             () => request<{ data: EquityPoint[] }>("/api/equity"),
    trades:             () => request<{ data: Trade[] }>("api/trades"),
    strategy:           () => request<any>("/api/strategy"),
    updateStrategy:     (body: unknown) => request<{ ok: boolean }>("/api/strategy", json(body)),
    submitBacktest:     (duration: number) =>
                        request<{ job_id: string}>("/api/backtest", json({ duration })),
    backtestStatus:     (jobId: string) => request<any>(`/api/backtest/${jobId}`),
    engineStart:        () => request<{ ok: boolean }>("/api/engine/start", { method: "POST"}),
    engineStop:         () => request<{ ok: boolean }>("/api/engine/stop", { method: "POST"}),
    cacheStatus:        () => request<any>("/api/cache/status"),
};