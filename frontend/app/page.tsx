import HeroCard from "@/components/dashboard/HeroCard";
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
      </div>


      <Section>Active position</Section>
    </div>
  )
}