"use client";

import { useState } from "react";
import { MapPicker } from "./MapPicker";

export type PlaceDraft = {
  latitude: number;
  longitude: number;
  name: string;
  address?: string | null;
  externalId?: string | null;
  categoryName?: string | null;
  categoryCode?: string | null;
};

export function PlacePicker({
  value,
  onChange,
}: {
  value: PlaceDraft | null;
  onChange: (next: PlaceDraft | null) => void;
}) {
  const [open, setOpen] = useState(false);

  if (!value) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[color:var(--rule)] px-3 py-1.5 text-[12px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--foreground)]"
        >
          <PinIcon />
          장소 추가
        </button>
        <MapPicker
          open={open}
          onClose={() => setOpen(false)}
          onSelect={(next) => onChange(next)}
        />
      </>
    );
  }

  return (
    <>
      <div className="flex w-fit max-w-full items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="장소 다시 선택"
          className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--pay)]/10 px-2.5 py-1 text-[12px] font-medium text-[color:var(--pay-forest)] transition-colors hover:bg-[color:var(--pay)]/15"
        >
          <PinIcon />
          <span className="max-w-[200px] truncate">{value.name}</span>
        </button>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-[11px] text-[color:var(--ink-soft)] underline-offset-2 hover:text-[color:var(--danger)] hover:underline"
        >
          제거
        </button>
      </div>
      <MapPicker
        open={open}
        onClose={() => setOpen(false)}
        onSelect={(next) => onChange(next)}
      />
    </>
  );
}

function PinIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}
