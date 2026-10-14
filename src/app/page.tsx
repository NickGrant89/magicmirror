import { Suspense } from "react";
import { MirrorBoard } from "@/components/mirror/mirror-board";

function MirrorFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center text-white/40">
      Waking mirror…
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<MirrorFallback />}>
      <MirrorBoard />
    </Suspense>
  );
}
