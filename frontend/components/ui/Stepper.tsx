"use client";

interface StepperProps {
    value: number;
    onChange: (v: number) => void;
    min?: number;
    max?: number;
    step?: number;
    suffix?: string;
}

export default function Stepper({
    value, onChange, min, max, step = 1, suffix = "",
} : StepperProps) {
    const dec = () => onChange(min !== undefined ? Math.max(min, value - step) : value - step);
    const inc = () => onChange(max !== undefined ? Math.min(max, value + step) : value + step);

    return (
        <div className="flex items-center gap-1.5 flex-shrink-0">
            <button onClick={dec} className="w-7 h-7 rounded-md bg-[#252836] text-[#7E839A] text-sm
                flex items-center justify-center border-0 cursor-pointer
                hover:bg-[#2E3348] hover:text-white transition-colors">
                -
            </button>
            <span className="w-16 text-center text-sm font-mono font-semibold text-white tabular-nums">
                {value}{suffix}
            </span>
            <button onClick={inc} className="w-7 h-7 rounded-md bg-[#252836] text-[#7E839A] text-sm
                flex items-center justify-center border-0 cursor-pointer
                hover:bg-[#2E3348] hover:text-white transition-colors">
                +
            </button>
        </div>
    )
}