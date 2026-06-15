"use client";

import { useState } from "react";
import { TransferSheet } from "./TransferSheet";

type Target = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

/** 프로필·DM 등에서 특정 상대에게 바로 송금 — 수신자 프리셋된 TransferSheet 런처. */
export function SendMoneyButton({
  user,
  className,
  label = "송금",
}: {
  user: Target;
  className?: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          className ??
          "no-scale inline-flex items-center gap-1.5 rounded-full border border-[color:var(--pay)]/40 px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-forest)] transition-colors hover:bg-[color:var(--pay)]/10"
        }
      >
        {label}
      </button>
      {open && (
        <TransferSheet
          recipient={{ ...user, avatarUrl: user.avatarUrl ?? null }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
