import type { ReactNode } from "react";

interface SettingRowProps {
    label: string;
    hint: string;
    control: ReactNode;
}

export default function SettingRow({ label, hint, control}: SettingRowProps) {
    return (
        <div className="flex items-center gap-6 py-3.5 border-b border-[#252836]">
            <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white leading-tight">{label}</div>
                <div className="text-xs text-[#7E839A] mt-0.5">{hint}</div>
            </div>
            {control}
        </div>
    );
}