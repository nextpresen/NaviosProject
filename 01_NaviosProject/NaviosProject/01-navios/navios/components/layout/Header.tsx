import Image from "next/image";
import Link from "next/link";
import { AuthControls } from "./AuthControls";

export function Header() {
  return (
    <header className="hidden lg:flex flex-shrink-0 bg-white/90 backdrop-blur-xl border-b border-slate-200/60 px-6 py-3.5 items-center justify-between shadow-sm">
      <Link href="/" className="flex items-center gap-3" aria-label="Go to home">
        <div className="w-9 h-9 rounded-xl bg-white ring-1 ring-slate-200 flex items-center justify-center shadow-sm">
          <Image src="/navios-logo.svg" alt="Navios logo" width={28} height={28} className="w-7 h-7" priority />
        </div>
        <div>
          <h1 className="text-lg font-extrabold tracking-tight leading-none">Navios</h1>
          <p className="text-[11px] text-slate-400 font-medium tracking-wide">LIFE NAVI OS</p>
        </div>
      </Link>
      <AuthControls />
    </header>
  );
}
