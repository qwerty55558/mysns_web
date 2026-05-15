"use client";

import Link from "next/link";
import { signOut, useSession } from "next-auth/react";

export function MeBadge() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <span className="text-[12px] text-[color:var(--ink-soft)]">…</span>
    );
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[transform,filter] hover:brightness-105 active:scale-[0.98]"
      >
        Sign in
      </Link>
    );
  }

  const displayName = session.user.name ?? session.user.username ?? "you";
  const username = session.user.username ?? "";

  return (
    <div className="flex items-center gap-3 text-[12.5px]">
      <span className="flex items-center gap-2">
        <span className="bg-pay-gradient inline-flex h-7 w-7 items-center justify-center rounded-full p-[2px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--paper)] text-[10.5px] font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </span>
        <span>
          <span className="font-medium">{displayName}</span>{" "}
          {username && (
            <span className="text-[color:var(--ink-soft)]">@{username}</span>
          )}
        </span>
      </span>
      <button
        onClick={() => signOut({ redirectTo: "/" })}
        className="rounded-full border border-[color:var(--rule)] px-3 py-1 text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--foreground)]"
      >
        Sign out
      </button>
    </div>
  );
}
