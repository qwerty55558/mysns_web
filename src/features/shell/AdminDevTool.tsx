"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const BTN = 44; // 버튼 지름 (h-11/w-11)
const EDGE = 16; // 사이드에 붙을 때 좌우 여백
const TOP_MIN = 72; // 상단 헤더 영역 확보
const BOTTOM_RESERVED = 96; // 하단 탭바와 안 겹치게 확보 (bottom-24 상당)
const DRAG_THRESHOLD = 4; // 클릭/드래그 구분 픽셀
const STORAGE_KEY = "payflow.admin-devtool.pos";

type Side = "left" | "right";

/**
 * ADMIN 전용 플로팅 데브툴. 작은 버튼을 누르면 운영 도구(현재 Grafana) 숏컷이
 * 펼쳐진다. 버튼은 드래그로 옮길 수 있고, 놓으면 가까운 좌/우 사이드에 딱 붙으며
 * 하단 탭바와 겹치지 않게 세로 범위가 제한된다. 위치는 localStorage에 저장된다.
 * 비-ADMIN 세션에서는 렌더하지 않는다.
 */
export function AdminDevTool() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [side, setSide] = useState<Side>("right");
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  // 화면 안 + 푸터 위로 위치를 강제하는 클램프
  const clamp = useCallback((x: number, y: number) => {
    const maxX = window.innerWidth - BTN - EDGE;
    const maxY = window.innerHeight - BTN - BOTTOM_RESERVED;
    return {
      x: Math.min(Math.max(x, EDGE), Math.max(EDGE, maxX)),
      y: Math.min(Math.max(y, TOP_MIN), Math.max(TOP_MIN, maxY)),
    };
  }, []);

  // 초기 위치 — 저장값 또는 우하단 기본
  useEffect(() => {
    let initSide: Side = "right";
    let y = window.innerHeight - BTN - BOTTOM_RESERVED;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw) as { side: Side; y: number };
        initSide = saved.side === "left" ? "left" : "right";
        if (typeof saved.y === "number") y = saved.y;
      }
    } catch {
      /* noop */
    }
    const x = initSide === "left" ? EDGE : window.innerWidth - BTN - EDGE;
    setSide(initSide);
    setPos(clamp(x, y));
  }, [clamp]);

  // 리사이즈 시 사이드 유지하며 화면 안으로 재배치
  useEffect(() => {
    const onResize = () =>
      setPos((p) => {
        if (!p) return p;
        const x = side === "left" ? EDGE : window.innerWidth - BTN - EDGE;
        return clamp(x, p.y);
      });
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [side, clamp]);

  // 외부 클릭 / Esc 로 메뉴 닫기
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

  const onPointerDown = (e: React.PointerEvent) => {
    if (!pos) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = {
      startX: e.clientX,
      startY: e.clientY,
      originX: pos.x,
      originY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const st = drag.current;
    if (!st) return;
    const dx = e.clientX - st.startX;
    const dy = e.clientY - st.startY;
    if (!st.moved) {
      if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
      st.moved = true;
      setDragging(true);
      setOpen(false);
    }
    setPos(clamp(st.originX + dx, st.originY + dy));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const st = drag.current;
    drag.current = null;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    if (!st || !pos) return;
    if (!st.moved) {
      setOpen((v) => !v);
      return;
    }
    setDragging(false);
    const nextSide: Side = pos.x + BTN / 2 < window.innerWidth / 2 ? "left" : "right";
    const x = nextSide === "left" ? EDGE : window.innerWidth - BTN - EDGE;
    const snapped = clamp(x, pos.y);
    setSide(nextSide);
    setPos(snapped);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ side: nextSide, y: snapped.y }));
    } catch {
      /* noop */
    }
  };

  if (session?.user?.role !== "ADMIN" || !pos) return null;

  return (
    <div
      ref={wrapRef}
      className="fixed z-50"
      style={{ left: pos.x, top: pos.y }}
    >
      {open && !dragging && (
        <div
          role="menu"
          className={`absolute bottom-full mb-2 w-48 overflow-hidden rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] shadow-[0_18px_38px_-16px_rgba(20,12,30,0.5)] ${
            side === "left" ? "left-0" : "right-0"
          }`}
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
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ touchAction: "none" }}
        className={`no-scale inline-flex h-11 w-11 items-center justify-center rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] text-[color:var(--danger)] shadow-[0_10px_28px_-12px_rgba(214,70,63,0.6)] hover:brightness-105 ${
          dragging
            ? "cursor-grabbing scale-[1.05]"
            : "cursor-grab transition-[transform,filter] active:scale-[0.95]"
        }`}
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
