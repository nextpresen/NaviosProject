interface MapStatsProps {
  total: number;
  today: number;
  upcoming: number;
}

export function MapStats({ total, today, upcoming }: MapStatsProps) {
  return (
    <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-3 py-2.5 border border-white/60 shadow-lg flex items-center gap-3">
      <div className="min-w-[42px] text-center">
        <p className="text-[10px] font-semibold text-slate-400 tracking-wider text-center">ALL</p>
        <p className="text-xl font-extrabold text-slate-800 leading-tight text-center">{total}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div className="min-w-[78px] rounded-xl bg-gradient-to-r from-pink-500 to-fuchsia-600 px-3 py-2 text-center shadow-[0_8px_18px_rgba(219,39,119,0.28)]">
        <p className="inline-flex items-center justify-center gap-1 text-[10px] font-extrabold text-white/90 tracking-wider text-center">
          <span className="relative inline-flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          LIVE NOW
        </p>
        <p className="text-xl font-extrabold text-white leading-tight text-center">{today}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div className="min-w-[42px] text-center">
        <p className="text-[10px] font-semibold text-slate-400 tracking-wider text-center">SOON</p>
        <p className="text-xl font-extrabold text-brand-600 leading-tight text-center">{upcoming}</p>
      </div>
    </div>
  );
}
