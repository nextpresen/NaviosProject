interface MapStatsProps {
  total: number;
  today: number;
  upcoming: number;
}

export function MapStats({ total, today, upcoming }: MapStatsProps) {
  return (
    <div className="pointer-events-auto bg-white/85 backdrop-blur-xl rounded-2xl px-4 py-3 border border-white/60 shadow-lg flex gap-5">
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Total</p>
        <p className="text-xl font-extrabold text-slate-800 leading-tight">{total}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div>
        <p className="text-[10px] font-semibold text-amber-500 tracking-wider">いまココ</p>
        <p className="text-xl font-extrabold text-amber-500 leading-tight">{today}</p>
      </div>
      <div className="w-px bg-slate-200" />
      <div>
        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Upcoming</p>
        <p className="text-xl font-extrabold text-brand-600 leading-tight">{upcoming}</p>
      </div>
    </div>
  );
}
