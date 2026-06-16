/**
 * Manages WebSocket lifecyle in browser. Maintains connection by pinging client every 25 seconds 
 * when connected. Retries connection after being closed.
 * 
 */

"use client";

import { useEffect, useRef, useState } from "react";
import type { WsMessage } from "@/lib/types";

export function useWebSocket(
  url: string,
  onMessage: (msg: WsMessage) => void,
): boolean {
  const [connected, setConnected] = useState(false);
  const wsRef    = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingRef  = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    function connect() {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      // Sends a ping message every 25 secs to keep connection alive
      ws.onopen = () => {
        setConnected(true);
        pingRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 25_000);
      };

      // Parses data whenever server sends a message
      ws.onmessage = e => {
        try { onMessage(JSON.parse(e.data) as WsMessage); } catch {}
      };

      // Runs when WebSocket connection is closed
      ws.onclose = () => {
        setConnected(false);
       if(pingRef.current) clearInterval(pingRef.current);
        retryRef.current = setTimeout(connect, 3_000);
      };

      // Close connection when an error occurs
      ws.onerror = () => ws.close();
    }

    connect();
    return () => {
      if(retryRef.current) clearTimeout(retryRef.current);
      if(pingRef.current) clearInterval(pingRef.current);
      wsRef.current?.close();
    };
  }, [url]);
  return connected;
}
