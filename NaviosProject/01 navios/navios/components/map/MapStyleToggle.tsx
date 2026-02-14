"use client";

import type { MapStyle } from "@/types/event";
export type { MapStyle };

interface MapStyleToggleProps {
  style: MapStyle;
  onChange?: (style: MapStyle) => void;
}

const STYLE_OPTIONS: Array<{ key: MapStyle; label: string }> = [
  { key: "voyager", label: "Standard" },
  { key: "light", label: "Light" },
  { key: "dark", label: "Dark" },
];

export function MapStyleToggle({ style, onChange }: MapStyleToggleProps) {
  return (
    <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl p-1.5 border border-white/60 shadow-lg flex gap-1">
      {STYLE_OPTIONS.map((option) => {
        const active = option.key === style;
        return (
          <button
            key={option.key}
            type="button"
            onClick={() => onChange?.(option.key)}
            className={`style-btn text-xs font-semibold px-3 py-1.5 rounded-xl transition ${
              active ? "bg-slate-800 text-white" : "text-slate-500 hover:bg-white/60"
            }`}
            data-style={option.key}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
