// Defines an API contract for a section label component
interface SectionLabelProps {
    label: string;
    first?: boolean;    // Omits top padding on the first section of a page
}

export default function SectionLabel({ label, first=false}: SectionLabelProps) {
    return (
        <div className={`text-[10px] font-semibold text-[#7E839A] uppercase tracking-[0.1em] pb-1 ${first ? "" : "pt-6"}`}>
            {label}
        </div>
    )
}