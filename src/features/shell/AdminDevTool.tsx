"use client";

import { useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

/**
 * ADMIN 전용 플로팅 데브툴. 우하단에 고정된 작은 버튼을 누르면
 * 운영 도구(현재 Grafana) 숏컷이 펼쳐진다. 비-ADMIN 세션에서는 렌더하지 않는다.
 */
export function AdminDevTool() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (session?.user?.role !== "ADMIN") return null;

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-24 right-4 z-50 flex flex-col items-end gap-2 sm:bottom-6"
    >
      {open && (
        <div
          role="menu"
          className="w-48 overflow-hidden rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] shadow-[0_18px_38px_-16px_rgba(20,12,30,0.5)]"
        >
          <p className="border-b border-[color:var(--rule)] px-3 py-2 text-[10.5px] font-semibold uppercase tracking-wide text-[color:var(--ink-soft)]">
            Admin tools
          </p>
          <a
            href="/grafana/"
            target="_blank"
            rel="noopener noreferrer"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[color:var(--rule)]/40"
          >
            <GrafanaIcon />
            Grafana
            <ExternalIcon />
          </a>
        </div>
      )}

      <button
        type="button"
        aria-label="어드민 도구"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="no-scale inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] text-[color:var(--pay)] shadow-[0_10px_28px_-12px_rgba(3,199,90,0.6)] transition-[transform,filter] hover:brightness-105 active:scale-[0.95]"
      >
        <WrenchIcon />
      </button>
    </div>
  );
}

function WrenchIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z" />
    </svg>
  );
}

function GrafanaIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3v18h18" />
      <path d="M7 14l3-4 3 3 4-6" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className="ml-auto text-[color:var(--ink-soft)]"
    >
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}
