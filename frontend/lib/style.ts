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

// ----------------- Component patterns -----------------
// Dark card container -- used for custom head/body in Card UI
export const card = "bg-[#181B24] border border-[#252836] rounded-[14px] overflow-hidden flex flex-col";

// Cicrular/rounded icon box used in card headers
export const iconBox = [
    "w-[38px] h-[38px] rounded-[10px] flex-shrink-0",
    "bg-[#1A1A2E] border border-[#252836]",
    "flex items-center justify-center",
].join(" ");

// Small raised container for parameter display
export const paramBox = "bg-[#1E2130] rounded-lg px-[10px] py-2";

// Uppercase micro-label above a stat value
export const statLabel = "text-[9px] text-[#7E839A] uppercase tracking-[0.05em] mb-[3px]";

// Monospace stat value
export const statValue = "text-[13px] font-semibold text-white font-mon";

// Status badge variants
export const badgeActive  = "text-[9px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded bg-[rgba(0,212,106,0.12)] text-[#00D46A]";
export const badgePaused  = "text-[9px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded bg-[#1E2130] text-[#7E839A]";
export const badgeLive    = "text-[9px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded bg-[rgba(0,212,106,0.12)] text-[#00D46A]";
export const badgeDraft   = "text-[9px] font-bold tracking-[0.06em] px-[7px] py-[3px] rounded bg-[#1E2130] text-[#7E839A]";
