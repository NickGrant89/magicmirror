export function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mirror-label mb-3 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-white/45">
      {children}
    </p>
  );
}
