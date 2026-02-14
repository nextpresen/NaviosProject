"use client";

import type { ReactNode } from "react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  children: ReactNode;
}

export function BottomSheet({ isOpen, onClose, children }: BottomSheetProps) {
  return (
    <>
      <div
        className={`bottom-sheet-overlay fixed inset-0 z-[2000] bg-black/30 transition-opacity ${isOpen ? "open opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}
        onClick={onClose}
      />
      <div className={`bottom-sheet fixed left-0 right-0 bottom-0 z-[2001] bg-white rounded-t-[20px] shadow-2xl max-h-[75dvh] flex flex-col transition-transform ${isOpen ? "open translate-y-0" : "translate-y-full"}`}>
        <div className="handle w-9 h-1 rounded-full bg-surface-300 mt-2.5 mx-auto flex-shrink-0" />
        <div className="flex-1 overflow-y-auto custom-scroll p-4">{children}</div>
      </div>
    </>
  );
}
