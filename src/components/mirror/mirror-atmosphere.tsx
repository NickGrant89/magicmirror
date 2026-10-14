export function MirrorAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
    >
      <div className="mirror-sky absolute inset-0" />
      <div className="mirror-aurora mirror-aurora-a absolute -left-1/4 top-[-20%] h-[75%] w-[85%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-b absolute -right-[15%] top-[5%] h-[60%] w-[75%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-c absolute bottom-[-20%] left-[10%] h-[55%] w-[75%] rounded-full" />
      <div className="mirror-stars absolute inset-0 opacity-80" />
      <div className="mirror-grain absolute inset-0 opacity-[0.22]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/45 to-black/80" />
    </div>
  );
}
