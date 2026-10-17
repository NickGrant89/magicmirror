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
        "mirror-label font-medium uppercase text-white/45",
        compact
          ? "mb-1.5 text-[0.6rem] tracking-[0.24em]"
          : "mb-3 text-[0.7rem] tracking-[0.28em]",
      )}
    >
      {children}
    </p>
  );
}
