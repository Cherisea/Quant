import StatusBar from "@/components/dashboard/StatusBar";
import EquityChart from "@/components/dashboard/EquityChart";
import KpiGrid from "@/components/dashboard/KpiGrid";
import TradeLog from "@/components/dashboard/TradeLog";

export default function DashboardPage() {
  return (
    <>
      <StatusBar />
      <div style={{ padding: 20 }}>
        <KpiGrid />
        <EquityChart />
        <TradeLog />
      </div>
    </>
  )
}