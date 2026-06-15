"use client";

import { useEffect } from "react";

export function SheetShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        type="button"
        aria-label="닫기"
        onClick={onClose}
        className="no-scale absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      <div className="relative z-10 flex max-h-[85vh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-3xl bg-[color:var(--background)] p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="no-scale text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
