"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function PostModal({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") router.back();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [router]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="게시물"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 sm:p-8"
      onClick={(e) => {
        if (e.target === e.currentTarget) router.back();
      }}
    >
      <div className="relative my-auto w-full max-w-2xl">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="닫기"
          className="absolute -top-1 right-0 z-10 inline-flex h-9 w-9 -translate-y-full items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50 sm:-right-12 sm:top-0 sm:translate-y-0"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}
