"use client";

import { useEffect, useMemo, useState } from "react";

interface EventViewCountProps {
  eventId: string;
  initialCount: number;
}

const VIEW_COUNT_THROTTLE_MS = 30 * 60 * 1000;

function storageKey(eventId: string) {
  return `navios:viewed_at:${eventId}`;
}

export function EventViewCount({ eventId, initialCount }: EventViewCountProps) {
  const [count, setCount] = useState(initialCount);
  const key = useMemo(() => storageKey(eventId), [eventId]);

  useEffect(() => {
    const now = Date.now();
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const last = Number(raw);
        if (Number.isFinite(last) && now - last < VIEW_COUNT_THROTTLE_MS) {
          return;
        }
      }
      window.localStorage.setItem(key, String(now));
    } catch {
      // Continue without throttling when localStorage is unavailable.
    }

    let cancelled = false;
    const run = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/view`, {
          method: "POST",
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json().catch(() => null)) as
          | { view_count?: number; data?: { view_count?: number } }
          | null;
        const next = payload?.view_count ?? payload?.data?.view_count;
        if (!cancelled && typeof next === "number") {
          setCount(next);
          return;
        }
        if (!cancelled) setCount((prev) => prev + 1);
      } catch {
        // Ignore counting errors on UI.
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [eventId, key]);

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
      <span>{count.toLocaleString()} 閲覧</span>
    </div>
  );
}

