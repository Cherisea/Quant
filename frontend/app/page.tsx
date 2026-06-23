import HeroCard from "@/components/dashboard/HeroCard";
import BalanceChart from "@/components/dashboard/BalanceChart";
import AllocationRing from "@/components/dashboard/AllocationRing";
import PositionCard from "@/components/dashboard/PositionCard";
import { T } from "@/lib/theme";

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

      <Section>Active position</Section>
      <div>
        <PositionCard />
      </div>
    </div>
  )
}