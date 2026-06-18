import PageHeader from "@/components/ui/PageHeader";
import BacktestView from "@/components/backtest/BacktestView";

export default function BacktestPage() {
    return (
        <div style={{ padding: 20 }}>
                <PageHeader title="Backtest" sub="Run your strategy against historical price data" />
                <BacktestView></BacktestView>
        </div>
    )
}