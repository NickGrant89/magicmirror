export function MirrorAtmosphere() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-black"
    >
      <div className="mirror-sky absolute inset-0" />
      <div className="mirror-aurora mirror-aurora-a absolute -left-1/4 top-[-20%] h-[70%] w-[80%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-b absolute -right-1/5 top-[10%] h-[55%] w-[70%] rounded-full" />
      <div className="mirror-aurora mirror-aurora-c absolute bottom-[-25%] left-[15%] h-[50%] w-[70%] rounded-full" />
      <div className="mirror-stars absolute inset-0 opacity-70" />
      <div className="mirror-grain absolute inset-0 opacity-[0.18]" />
      <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/55 to-black/85" />
    </div>
  );
}
