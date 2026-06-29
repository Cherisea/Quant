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
        <div>
            <input />
            <span>
                {display}
            </span>
        </div>
    )
}