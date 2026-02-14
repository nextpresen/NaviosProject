interface SpotBadgeProps {
  count: number;
}

export function SpotBadge({ count }: SpotBadgeProps) {
  return (
    <div className="lg:hidden absolute top-3 right-3 z-[1000]">
      <div className="bg-white/85 backdrop-blur-xl rounded-full px-3 py-1.5 border border-white/60 shadow-lg flex items-center gap-1.5">
        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
        <span className="text-xs font-bold text-slate-700">{count}</span>
        <span className="text-[10px] text-slate-400">events</span>
      </div>
    </div>
  );
}
