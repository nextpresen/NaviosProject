import { AuthControls } from "./AuthControls";

export function Header() {
  return (
    <header className="hidden lg:flex flex-shrink-0 bg-white border-b border-surface-200 px-6 py-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight leading-none">Navios</h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">LIFE NAVI OS</p>
        </div>
      </div>
      <AuthControls />
    </header>
  );
}
