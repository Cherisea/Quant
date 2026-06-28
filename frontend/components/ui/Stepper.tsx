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
        <div>
            <button onClick={dec}>
                -
            </button>
            <span>
                {value}{suffix}
            </span>
            <button onClick={inc}>
                +
            </button>
        </div>
    )
}