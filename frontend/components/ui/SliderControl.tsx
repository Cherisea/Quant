"use client";

interface SliderControlProps {
    value: number;
    onChange: (v: number) => void;
    min: number;
    max: number;
    step: number;
    display: string;
}

export default function SliderControl({value, onChange, min, max, step, display}: SliderControlProps) {
    return (
        <div className="flex items-center gap-3 flex-shrink-0">
            <input 
                type="range" min={min} max={max} step={step} value={value}
                onChange={e => onChange(+e.target.value)}
                className="w-36 accent-[#00D46A]" />
            <span className="w-16 text-right text-sm font-mono font-bold text-[#00D46A]">
                {display}
            </span>
        </div>
    )
}