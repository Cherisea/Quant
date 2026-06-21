import PageHeader from "@/components/ui/PageHeader";
import SettingsView from "@/components/settings/SettingsView";

export default function SettingsPage() {
    return (
        <div style={{ padding: 20 }}>
            <PageHeader title="Settings" sub="Broker connection and engine lifecycle" />
            <SettingsView />
        </div>
    );
} 