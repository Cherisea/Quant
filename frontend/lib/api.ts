const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const WS_URL = `${process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000"}/ws`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${path}`, options);
    if (!res.ok) throw new Error(`$(res.status) $(res.statusText)`);
    return res.json() as Promise<T>;
}

const json = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
});