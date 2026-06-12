"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { Avatar } from "@/features/messages/Avatar";

const MeAvatarQuery = graphql(`
  query MeAvatar {
    me {
      id
      avatarUrl
    }
  }
`);

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { data: meData } = useQuery(MeAvatarQuery, {
    skip: status !== "authenticated",
    fetchPolicy: "cache-first",
  });
  const avatarUrl = meData?.me?.avatarUrl ?? null;

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

  if (status === "loading") {
    return <span className="text-[12px] text-[color:var(--ink-soft)]">…</span>;
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
  const profileHref = username ? `/u/${username}` : "/me";

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="메뉴"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="no-scale relative inline-flex items-center gap-2 rounded-full border border-[color:var(--rule)] py-1 pl-1 pr-2 transition-colors hover:border-[color:var(--pay)]/40"
      >
        <Avatar avatarUrl={avatarUrl} displayName={displayName} size={28} />
        <HamburgerIcon />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-[calc(100%+6px)] z-30 w-56 overflow-hidden rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] shadow-[0_18px_38px_-20px_rgba(20,12,30,0.45)]"
        >
          <div className="flex items-center gap-2.5 border-b border-[color:var(--rule)] px-3 py-3">
            <Avatar avatarUrl={avatarUrl} displayName={displayName} size={36} />
            <div className="min-w-0">
              <p className="truncate text-[13px] font-semibold">{displayName}</p>
              {username && (
                <p className="truncate text-[11.5px] text-[color:var(--ink-soft)]">
                  @{username}
                </p>
              )}
            </div>
          </div>
          <Link
            href={profileHref}
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[color:var(--rule)]/40"
          >
            <PersonIcon />
            프로필
          </Link>
          <Link
            href="/bookmarks"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[color:var(--rule)]/40"
          >
            <BookmarkIcon />
            북마크
          </Link>
          <Link
            href="/settings"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2.5 text-[13px] hover:bg-[color:var(--rule)]/40"
          >
            <GearIcon />
            설정
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              void signOut({ redirectTo: "/" });
            }}
            className="flex w-full items-center gap-2 border-t border-[color:var(--rule)] px-3 py-2.5 text-left text-[13px] text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10"
          >
            <SignOutIcon />
            로그아웃
          </button>
        </div>
      )}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function PersonIcon() {
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
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </svg>
  );
}

function BookmarkIcon() {
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
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function GearIcon() {
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
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1A1.7 1.7 0 0 0 9 19.4a1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1A1.7 1.7 0 0 0 4.6 9a1.7 1.7 0 0 0-.3-1.8l-.1-.1A2 2 0 1 1 7 4.3l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9c0 .7.4 1.3 1 1.5H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z" />
    </svg>
  );
}

function SignOutIcon() {
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
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
