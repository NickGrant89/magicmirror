export type DataSource = "live" | "mock";

export type CalendarEvent = {
  id: string;
  title: string;
  startsAt: string;
  endsAt: string;
  location?: string;
  allDay?: boolean;
};

export type TaskItem = {
  id: string;
  title: string;
  dueAt?: string;
  completed: boolean;
  list?: string;
};

export type DoorbellEvent = {
  id: string;
  title: string;
  occurredAt: string;
  camera: string;
  thumbnailUrl?: string;
  summary: string;
};

export type CryptoQuote = {
  symbol: "BTC" | "VET" | "XRP";
  name: string;
  usdt: number;
  gbp: number;
  change24hPct?: number;
};

export type WeatherSnapshot = {
  locationLabel: string;
  temperatureC: number;
  feelsLikeC: number;
  weatherCode: number;
  windKph: number;
  summary: string;
  highC: number;
  lowC: number;
};

export type CalendarPayload = {
  source: DataSource;
  events: CalendarEvent[];
  note?: string;
};

export type TasksPayload = {
  source: DataSource;
  tasks: TaskItem[];
  note?: string;
};

export type DoorbellPayload = {
  source: DataSource;
  event: DoorbellEvent | null;
  note?: string;
};

export type CryptoPayload = {
  source: DataSource;
  quotes: CryptoQuote[];
  updatedAt: string;
  note?: string;
};

export type WeatherPayload = {
  source: DataSource;
  weather: WeatherSnapshot;
  note?: string;
};

export type AlbumPhoto = {
  id: string;
  url: string;
  caption?: string;
};

export type PhotosPayload = {
  source: DataSource;
  albumName: string;
  photos: AlbumPhoto[];
  note?: string;
};

export type BluetoothPayload = {
  source: DataSource;
  available: boolean;
  connected: boolean;
  deviceName: string | null;
  deviceAddress: string | null;
  sinkName: string | null;
  volumePct: number;
  muted: boolean;
  note?: string;
};

export type NewsItem = {
  id: string;
  title: string;
  link?: string;
  publishedAt?: string;
};

export type NewsPayload = {
  source: DataSource;
  feedTitle: string;
  items: NewsItem[];
  note?: string;
};

