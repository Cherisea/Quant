"use client";

import SideBar from "./SideBar";
import { T } from "@/lib/theme";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", minHeight: "100vh", background: T.bg, color: T.text }}>
            <SideBar />
            <main style={{ flex: 1, minWidth: 0 }}>
                {children}
            </main>
        </div>
    );
}