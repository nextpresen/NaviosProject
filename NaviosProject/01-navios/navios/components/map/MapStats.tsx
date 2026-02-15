interface MapStatsProps {
  total: number;
  today: number;
  upcoming: number;
}

export function MapStats({ total, today, upcoming }: MapStatsProps) {
  return (
    <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg flex gap-5">
      <div>
        <p className="text-[10px] font-semibold text-slate-400 tracking-wider">みつけた数</p>
        <p className="text-xl font-extrabold text-slate-800 leading-tight">{total}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div>
        <p className="text-[10px] font-semibold text-pink-500 tracking-wider">LIVE NOW</p>
        <p className="text-xl font-extrabold text-pink-600 leading-tight">{today}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div>
        <p className="text-[10px] font-semibold text-slate-400 tracking-wider">まもなく</p>
        <p className="text-xl font-extrabold text-brand-600 leading-tight">{upcoming}</p>
      </div>
    </div>
  );
}
