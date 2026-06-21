/**
 * Shared Tailwind class string.
 * 
 * Every string must be a complete literal so Tailwind's scanner can detect the 
 * class name at build time. Never build a class name from a dynamic value.
 * 
 */

// ----------------- Form controls -----------------
export const input = [
    "w-full rounded-md border border-slate-200 bg-[#EFF2F6]",
    "px-2.5 py-[7px] text-xs font-mono text-gray-900",
    "outline-none transition-colors focus:border-indigo-600",
].join(" ");

// Select differs only in font — system-ui instead of monospace
export const select = [
  "w-full rounded-md border border-slate-200 bg-[#EFF2F6]",
  "px-2.5 py-[7px] text-xs font-sans text-gray-900",
  "outline-none transition-colors focus:border-indigo-600",
].join(" ");
 

// ----------------- Shared base button -----------------
const btnBase = [
    "inline-flex items-center gap-[5px] rounded-md border-0",
    "text-xs font-medium cursor-pointer transition-opacity",
    "hover:opacity-80 disabled:opacity-60 disabled:cursor-not-allowed",
].join(" ");

// Standard size (used in StrategyView, BacktestView)
export const btnPrimary   = `${btnBase} bg-indigo-600 text-white px-3.5 py-[7px]`;
export const btnDanger    = `${btnBase} bg-red-100 text-red-600 px-3.5 py-[7px]`;
export const btnSecondary = `${btnBase} bg-[#EFF2F6] text-gray-500 border border-slate-200 px-3.5 py-[7px]`;
 
// Small size (used in SettingsView dialogs)
export const btnPrimarySmall   = `${btnBase} bg-indigo-600 text-white px-3 py-[5px] text-[11px]`;
export const btnDangerSmall    = `${btnBase} bg-red-100 text-red-600 px-3 py-[5px] text-[11px]`;
export const btnSecondarySmall = `${btnBase} bg-[#EFF2F6] text-gray-500 border border-slate-200 px-3 py-[5px] text-[11px]`;