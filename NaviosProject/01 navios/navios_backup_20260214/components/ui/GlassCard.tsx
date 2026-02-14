import type { ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
}

export function GlassCard({ children, className = "" }: GlassCardProps) {
  return (
    <div className={`glass bg-white/85 backdrop-blur-xl border border-white/60 shadow-lg ${className}`}>
      {children}
    </div>
  );
}
