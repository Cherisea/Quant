"use client";

import {input} from "@/lib/style";

// Define a contract for expected properties
interface NumInputProps {
  value:            number; 
  onChange:         (v: number)=>void; 
  min?:             number; 
  max?:             number; 
  step?:            number; 
}

export default function NumInput({value, onChange, min, max, step=1}: NumInputProps) {
    return (
        <input 
          type="number" value={value} min={min} max={max} step={step}
          onChange={e => onChange(Number(e.target.value))} 
          className={input}>
        </input>
    );
}