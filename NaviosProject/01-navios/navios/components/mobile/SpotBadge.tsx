interface SpotBadgeProps {
  liveNowCount: number;
}

export function SpotBadge({ liveNowCount }: SpotBadgeProps) {
  return (
    <div className="lg:hidden absolute top-3 right-3 z-[1000]">
      <div className="bg-white/85 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/60 shadow-lg flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
        <span className="text-[10px] font-extrabold tracking-wide text-pink-600">LIVE NOW</span>
        <span className="text-xs font-bold text-slate-700">{liveNowCount}</span>
      </div>
    </div>
  );
}
