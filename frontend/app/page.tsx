import { T } from "@/lib/theme";
import Link from "next/link";
import HeroCard from "@/components/dashboard/HeroCard";
import PositionCard from "@/components/dashboard/PositionCard";
import BalanceChart from "@/components/dashboard/BalanceChart";
import AllocationRing from "@/components/dashboard/AllocationRing";
import StrategyCard from "@/components/dashboard/StrategyCard";


function Section({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.1em",
      textTransform: "uppercase", color: T.muted, marginBottom: 12}}>
        {children}
    </div>
  )
}

export default function DashboardPage() {
  return (
    <div style={{ padding: "22px 24px" }}>
      {/* Top row */}
      <div style={{ display: "grid", gridTemplateColumns: "1.7fr 1.3fr 1fr",
        gap: 16, marginBottom: 26}}>
          <HeroCard />
          <BalanceChart />
          <AllocationRing />
      </div>
      
      {/* Active position */}
      <Section>Active position</Section>
      <div style={{ display: "grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:26}}>
        <PositionCard />
        {/* Open new position */}
        <Link href="./" style={{ background:"transparent", border:`1.5px dashed ${T.border}`,
          borderRadius:14, display:"flex", flexDirection:"column", textDecoration: "none",
          alignItems:"center", justifyContent:"center", gap:10,
          padding:24, cursor:"pointer", minHeight:190 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:T.raised,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, color:T.green }}>+</div>
          <span style={{ fontSize:12, fontWeight:500, color:T.muted }}>
            Open new position
          </span>
        </Link>
      </div>

      {/* Active strategy */}
      <Section>Active strategy</Section>
      <div style={{ display: "grid", gridTemplateColumns:"repeat(4,1fr)", gap:14, marginBottom:26}}>
        <StrategyCard />
        {/* Open new position */}
        <Link href="/strategy" style={{ background:"transparent", border:`1.5px dashed ${T.border}`,
          borderRadius:14, display:"flex", flexDirection:"column", textDecoration: "none",
          alignItems:"center", justifyContent:"center", gap:10,
          padding:24, cursor:"pointer", minHeight:190 }}>
          <div style={{ width:48, height:48, borderRadius:12, background:T.raised,
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:22, color:T.green }}>+</div>
          <span style={{ fontSize:12, fontWeight:500, color:T.muted }}>
            Add new strategy
          </span>
        </Link>
      </div>
    </div>
  )
}