import type { Metadata } from "next";
import { TradingProvider } from "@/context/TradingContext";
// import AppShell from "@/components/layout/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: "MomentumBot",
  description: "HK momentum trading dashboard",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TradingProvider>
          {/* <AppShell>{children}</AppShell> */}
          {children}
        </TradingProvider>
      </body>
    </html>
  );
}