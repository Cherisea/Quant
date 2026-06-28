import type { ReactNode } from "react";

interface SettingRowProps {
    label: string;
    hint: string;
    control: ReactNode;
}

export default function SettingRow({ label, hint, control}: SettingRowProps) {
    return (
        <div>
            <div>
                <div>{label}</div>
                <div>{hint}</div>
            </div>
            {control}
        </div>
    );
}