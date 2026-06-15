import Link from "next/link";
import { UserMenu } from "@/features/auth/UserMenu";
import { NotificationsBell } from "./NotificationsBell";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-20 w-full border-b border-[color:var(--rule)] bg-[color:var(--background)]/85 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between px-5 py-3">
        <Link href="/home" className="font-display text-2xl italic tracking-tight">
          Payflow
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/search"
            aria-label="검색"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--rule)] transition-colors hover:border-[color:var(--pay)]/40"
          >
            <svg
              width="17"
              height="17"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </Link>
          <NotificationsBell />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
