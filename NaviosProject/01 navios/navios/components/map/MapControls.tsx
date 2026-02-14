"use client";

interface MapControlsProps {
  onClickMyLocation?: () => void;
  onClickResetView?: () => void;
}

export function MapControls({ onClickMyLocation, onClickResetView }: MapControlsProps) {
  return (
    <div className="absolute bottom-6 right-4 z-[1000] flex flex-col gap-2">
      <button
        type="button"
        onClick={onClickMyLocation}
        className="w-11 h-11 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition"
        title="現在地"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2m-3.636-6.364l-1.414 1.414M7.05 16.95l-1.414 1.414M16.95 16.95l1.414 1.414M7.05 7.05L5.636 5.636M12 8a4 4 0 100 8 4 4 0 000-8z" />
        </svg>
      </button>
      <button
        type="button"
        onClick={onClickResetView}
        className="w-11 h-11 rounded-2xl bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg flex items-center justify-center hover:bg-white transition"
        title="全体表示"
      >
        <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
    </div>
  );
}
