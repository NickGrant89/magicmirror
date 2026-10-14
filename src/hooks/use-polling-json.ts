"use client";

import { useEffect, useState } from "react";

type State<T> = {
  data: T | null;
  error: string | null;
  loading: boolean;
};

export function usePollingJson<T>(url: string, intervalMs: number) {
  const [state, setState] = useState<State<T>>({
    data: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function load() {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const json = (await res.json()) as T;
        if (!cancelled) {
          setState({ data: json, error: null, loading: false });
        }
      } catch (err) {
        if (!cancelled) {
          setState((prev) => ({
            data: prev.data,
            error: err instanceof Error ? err.message : "Failed to load",
            loading: false,
          }));
        }
      } finally {
        if (!cancelled) {
          timer = setTimeout(load, intervalMs);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [url, intervalMs]);

  return state;
}
