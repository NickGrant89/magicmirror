import { NextResponse } from "next/server";
import {
  connectPreferredSpeaker,
  mockBluetoothStatus,
  nudgeVolume,
  readBluetoothAudioStatus,
  setMuted,
  setVolumePct,
} from "@/lib/bluetooth-audio";
import type { BluetoothPayload } from "@/lib/types";

async function statusPayload(): Promise<BluetoothPayload> {
  const live = await readBluetoothAudioStatus();
  if (!live.available) {
    const mock = mockBluetoothStatus();
    return { source: "mock", ...mock };
  }
  return { source: "live", ...live };
}

export async function GET() {
  try {
    return NextResponse.json(await statusPayload());
  } catch {
    const mock = mockBluetoothStatus();
    return NextResponse.json({ source: "mock", ...mock });
  }
}

type ActionBody = {
  action?: "volume-up" | "volume-down" | "set-volume" | "mute" | "unmute" | "connect";
  volumePct?: number;
};

export async function POST(request: Request) {
  let body: ActionBody = {};
  try {
    body = (await request.json()) as ActionBody;
  } catch {
    body = {};
  }

  try {
    const live = await readBluetoothAudioStatus();
    if (!live.available) {
      // Dev/mock: pretend the action worked.
      const mock = mockBluetoothStatus();
      if (body.action === "volume-up") mock.volumePct = Math.min(100, mock.volumePct + 5);
      if (body.action === "volume-down") mock.volumePct = Math.max(0, mock.volumePct - 5);
      if (body.action === "set-volume" && typeof body.volumePct === "number") {
        mock.volumePct = Math.max(0, Math.min(100, Math.round(body.volumePct)));
      }
      if (body.action === "mute") mock.muted = true;
      if (body.action === "unmute") mock.muted = false;
      if (body.action === "connect") mock.connected = true;
      return NextResponse.json({ source: "mock", ...mock });
    }

    switch (body.action) {
      case "volume-up":
        await nudgeVolume(5);
        break;
      case "volume-down":
        await nudgeVolume(-5);
        break;
      case "set-volume":
        if (typeof body.volumePct === "number") {
          await setVolumePct(body.volumePct);
        }
        break;
      case "mute":
        await setMuted(true);
        break;
      case "unmute":
        await setMuted(false);
        break;
      case "connect":
        await connectPreferredSpeaker();
        break;
      default:
        return NextResponse.json(
          { error: "Unknown action" },
          { status: 400 },
        );
    }

    return NextResponse.json(await statusPayload());
  } catch (err) {
    const message = err instanceof Error ? err.message : "Bluetooth action failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
