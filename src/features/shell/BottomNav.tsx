"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { UnreadMessageCountQuery } from "@/features/messages/queries";
import { PendingSplitRequestsQuery } from "@/features/splits/queries";

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const { data } = useQuery(UnreadMessageCountQuery, {
    skip: status !== "authenticated",
    fetchPolicy: "cache-and-network",
  });
  const unread = data?.unreadMessageCount ?? 0;

  const { data: splitData } = useQuery(PendingSplitRequestsQuery, {
    variables: { limit: 50, offset: 0 },
    skip: status !== "authenticated",
    pollInterval: 30_000,
    fetchPolicy: "cache-and-network",
  });
  const pendingSplits = splitData?.pendingSplitRequests.length ?? 0;

  const feedActive = pathname === "/home";
  const msgActive = pathname.startsWith("/messages");
  const walletActive = pathname.startsWith("/wallet");
  const splitsActive = pathname.startsWith("/splits");
  const fundingActive = pathname.startsWith("/crowdfunding");
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
        <NavItem href="/wallet" label="지갑" active={walletActive}>
          <WalletIcon filled={walletActive} />
        </NavItem>
        <NavItem href="/splits" label="1/N" active={splitsActive} badge={pendingSplits}>
          <SplitIcon filled={splitsActive} />
        </NavItem>
        <NavItem href="/crowdfunding" label="펀딩" active={fundingActive}>
          <FundingIcon filled={fundingActive} />
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

function WalletIcon({ filled }: { filled: boolean }) {
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
      <path d="M3 7.5A2.5 2.5 0 0 1 5.5 5H18a2 2 0 0 1 2 2v1H5.5A2.5 2.5 0 0 1 3 7.5Z" />
      <path d="M3 7.5V17a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7H5.5A2.5 2.5 0 0 1 3 7.5Z" />
      <circle cx="16.5" cy="13.5" r="1.2" fill={filled ? "var(--paper)" : "currentColor"} stroke="none" />
    </svg>
  );
}

function SplitIcon({ filled }: { filled: boolean }) {
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
      <circle cx="7" cy="8" r="3" />
      <circle cx="17" cy="8" r="3" />
      <path d="M2.5 20a4.5 4.5 0 0 1 9 0" fill="none" />
      <path d="M12.5 20a4.5 4.5 0 0 1 9 0" fill="none" />
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

function FundingIcon({ filled }: { filled: boolean }) {
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
      <path d="M12 3 C8 3 5 6 5 10 C5 14 8 17 12 19 C16 17 19 14 19 10 C19 6 16 3 12 3Z" />
      <line x1="12" y1="19" x2="12" y2="21" />
      <line x1="9" y1="21" x2="15" y2="21" />
    </svg>
  );
}
