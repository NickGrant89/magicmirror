import { cn } from "@/lib/utils";

export function SectionLabel({
  children,
  compact,
}: {
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <p
      className={cn(
        "mirror-label flex items-center gap-1.5 font-medium uppercase text-white/50",
        compact
          ? "mb-1.5 text-[0.6rem] tracking-[0.24em]"
          : "mb-3 text-[0.7rem] tracking-[0.28em]",
      )}
    >
      <span
        className="mirror-label-pip size-1 shrink-0 rounded-full bg-teal-300/85"
        aria-hidden
      />
      {children}
    </p>
  );
}
