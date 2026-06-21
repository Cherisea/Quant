"use client";

import SideBar from "./SideBar";
import NavBar from "./NavBar";
import { T } from "@/lib/theme";

export default function AppShell({ children }: { children: React.ReactNode }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh", background: T.bg, color: T.text }}>
            <NavBar />
            <div style={{ display: "flex", flex: 1 }}>
                <SideBar />
                <main style={{ flex: 1, minWidth: 0 }}>
                    {children}
                </main>
            </div>
        </div>
    );
}