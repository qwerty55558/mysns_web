"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { UnreadMessageCountQuery } from "@/features/messages/queries";

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const { data } = useQuery(UnreadMessageCountQuery, {
    skip: status !== "authenticated",
    pollInterval: 30_000,
    fetchPolicy: "cache-and-network",
  });
  const unread = data?.unreadMessageCount ?? 0;

  const feedActive = pathname === "/home";
  const msgActive = pathname.startsWith("/messages");
  const profileActive = pathname.startsWith("/u/") || pathname === "/me";

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-[color:var(--rule)] bg-[color:var(--paper)]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-2xl items-stretch justify-around px-8 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        <NavItem href="/home" label="피드" active={feedActive}>
          <HomeIcon filled={feedActive} />
        </NavItem>
        <NavItem href="/messages" label="메시지" active={msgActive} badge={unread}>
          <ChatIcon filled={msgActive} />
        </NavItem>
        <NavItem href="/me" label="프로필" active={profileActive}>
          <PersonIcon filled={profileActive} />
        </NavItem>
      </div>
    </nav>
  );
}

function NavItem({
  href,
  label,
  active,
  badge = 0,
  children,
}: {
  href: string;
  label: string;
  active: boolean;
  badge?: number;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`relative flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors ${
        active
          ? "text-[color:var(--pay-forest)]"
          : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
      }`}
    >
      <span className="relative">
        {children}
        {badge > 0 && (
          <span className="absolute -right-2 -top-1.5 inline-flex h-[15px] min-w-[15px] items-center justify-center rounded-full bg-[color:var(--danger)] px-1 font-mono text-[9px] font-bold tabular-nums text-white shadow-sm">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </span>
      <span className="text-[10px] font-medium tracking-wide">{label}</span>
    </Link>
  );
}

function HomeIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 10.5 12 3l9 7.5" fill="none" />
      <path d="M5 9.5V21h14V9.5" />
      {!filled && <path d="M9.5 21v-6h5v6" fill="none" />}
    </svg>
  );
}

function ChatIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5Z" />
      {!filled && (
        <>
          <line x1="8.5" y1="11.5" x2="8.5" y2="11.5" />
          <line x1="12" y1="11.5" x2="12" y2="11.5" />
          <line x1="15.5" y1="11.5" x2="15.5" y2="11.5" />
        </>
      )}
    </svg>
  );
}

function PersonIcon({ filled }: { filled: boolean }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
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
