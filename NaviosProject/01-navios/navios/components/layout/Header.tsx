import Image from "next/image";
import { AuthControls } from "./AuthControls";

export function Header() {
  return (
    <header className="hidden lg:flex flex-shrink-0 bg-white border-b border-surface-200 px-6 py-3 items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center shadow-lg shadow-brand-500/25">
          <Image src="/navios-logo.svg" alt="Navios logo" width={28} height={28} className="w-7 h-7" />
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
