import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type BluetoothAudioStatus = {
  available: boolean;
  connected: boolean;
  deviceName: string | null;
  deviceAddress: string | null;
  sinkName: string | null;
  volumePct: number;
  muted: boolean;
  note?: string;
};

function preferredAddress() {
  return (process.env.BLUETOOTH_SPEAKER_MAC ?? "").trim().toUpperCase();
}

function preferredName() {
  return (process.env.BLUETOOTH_SPEAKER_NAME ?? "").trim().toLowerCase();
}

async function run(cmd: string, args: string[], timeoutMs = 4000) {
  const { stdout, stderr } = await execFileAsync(cmd, args, {
    timeout: timeoutMs,
    maxBuffer: 1024 * 1024,
  });
  return `${stdout}\n${stderr}`;
}

function parseVolumePercent(text: string): number | null {
  // Volume: front-left: 32768 / 65536 / 50%
  const match = text.match(/(\d+)%/);
  if (!match) return null;
  return Math.max(0, Math.min(100, Number(match[1])));
}

function parseMuted(text: string): boolean {
  return /Mute:\s*yes/i.test(text);
}

async function getDefaultSink(): Promise<string | null> {
  try {
    const out = (await run("pactl", ["get-default-sink"])).trim();
    const line = out.split("\n").map((l) => l.trim()).find(Boolean);
    return line || null;
  } catch {
    return null;
  }
}

async function getSinkInfo(sink: string) {
  const out = await run("pactl", ["list", "sinks"]);
  const blocks = out.split("Sink #");
  const block =
    blocks.find((b) => b.includes(`Name: ${sink}`)) ??
    blocks.find((b) => /bluez/i.test(b)) ??
    "";
  return {
    volumePct: parseVolumePercent(block) ?? 50,
    muted: parseMuted(block),
    description:
      block.match(/Description:\s*(.+)/)?.[1]?.trim() ??
      block.match(/device\.description = "([^"]+)"/)?.[1] ??
      null,
  };
}

async function listConnectedBluetooth(): Promise<
  { address: string; name: string }[]
> {
  try {
    const out = await run("bluetoothctl", ["devices", "Connected"]);
    const devices: { address: string; name: string }[] = [];
    for (const line of out.split("\n")) {
      const match = line.match(/Device\s+([0-9A-Fa-f:]{11,17})\s+(.+)/);
      if (!match) continue;
      devices.push({
        address: match[1].toUpperCase(),
        name: match[2].trim(),
      });
    }
    return devices;
  } catch {
    return [];
  }
}

export async function readBluetoothAudioStatus(): Promise<BluetoothAudioStatus> {
  const preferredMac = preferredAddress();
  const preferredLabel = preferredName();

  try {
    const connected = await listConnectedBluetooth();
    const sink = await getDefaultSink();
    const sinkInfo = sink ? await getSinkInfo(sink) : null;

    const device =
      connected.find((d) => preferredMac && d.address === preferredMac) ??
      connected.find(
        (d) => preferredLabel && d.name.toLowerCase().includes(preferredLabel),
      ) ??
      connected[0] ??
      null;

    // If a bluez sink is default but bluetoothctl list is empty, still show sink desc.
    const looksBluetooth = Boolean(sink && /bluez/i.test(sink));

    return {
      available: true,
      connected: Boolean(device) || looksBluetooth,
      deviceName: device?.name ?? sinkInfo?.description ?? null,
      deviceAddress: device?.address ?? (preferredMac || null),
      sinkName: sink,
      volumePct: sinkInfo?.volumePct ?? 50,
      muted: sinkInfo?.muted ?? false,
      note: looksBluetooth || device ? undefined : "No Bluetooth audio sink yet — pair a speaker on the Pi first.",
    };
  } catch {
    return {
      available: false,
      connected: false,
      deviceName: null,
      deviceAddress: preferredMac || null,
      sinkName: null,
      volumePct: 50,
      muted: false,
      note: "Bluetooth/audio tools unavailable here — mock controls only.",
    };
  }
}

export async function setVolumePct(pct: number) {
  const clamped = Math.max(0, Math.min(100, Math.round(pct)));
  await run("pactl", ["set-sink-volume", "@DEFAULT_SINK@", `${clamped}%`]);
  return clamped;
}

export async function nudgeVolume(delta: number) {
  const status = await readBluetoothAudioStatus();
  return setVolumePct(status.volumePct + delta);
}

export async function setMuted(muted: boolean) {
  await run("pactl", [
    "set-sink-mute",
    "@DEFAULT_SINK@",
    muted ? "1" : "0",
  ]);
}

export async function connectPreferredSpeaker() {
  const mac = preferredAddress();
  if (!mac) {
    throw new Error("Set BLUETOOTH_SPEAKER_MAC in .env.local first");
  }
  await run("bluetoothctl", ["connect", mac], 12000);
  // Give PulseAudio a moment, then prefer a bluez sink if present.
  await new Promise((r) => setTimeout(r, 1200));
  try {
    const sinks = await run("pactl", ["list", "short", "sinks"]);
    const bluez = sinks
      .split("\n")
      .map((l) => l.trim())
      .find((l) => /bluez/i.test(l));
    const sinkName = bluez?.split(/\s+/)[1];
    if (sinkName) {
      await run("pactl", ["set-default-sink", sinkName]);
    }
  } catch {
    // connection may still succeed even if sink switch fails
  }
}

export function mockBluetoothStatus(): BluetoothAudioStatus {
  return {
    available: false,
    connected: false,
    deviceName: process.env.BLUETOOTH_SPEAKER_NAME || "JBL Flip",
    deviceAddress: preferredAddress() || null,
    sinkName: null,
    volumePct: 42,
    muted: false,
    note: "Mock speaker — live on the Pi after pairing + BLUETOOTH_SPEAKER_MAC.",
  };
}
