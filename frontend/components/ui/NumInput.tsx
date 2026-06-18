"use client";

import {T} from "@/lib/theme";

const style = {
  width:"100%", boxSizing:"border-box" as const,
  background:T.elevated, border:`1px solid ${T.border}`, borderRadius:6,
  color:T.text, padding:"7px 10px", fontSize:12,
  fontFamily:"ui-monospace,monospace", outline:"none",
}

// Define a contract for expected properties
interface NumInputProps {value: number; onChange:(v: number)=>void; min?:number; max?:number; step?:number; }

export default function NumInput({value, onChange, min, max, step=1}: NumInputProps) {
    return <input type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(Number(e.target.value))} style={style}></input>
}