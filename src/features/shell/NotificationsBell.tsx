"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";

const UnreadNotificationCountQuery = graphql(`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`);

export function NotificationsBell() {
  const { status } = useSession();
  const { data } = useQuery(UnreadNotificationCountQuery, {
    skip: status !== "authenticated",
    fetchPolicy: "cache-and-network",
  });

  if (status !== "authenticated") return null;

  const count = data?.unreadNotificationCount ?? 0;

  return (
    <Link
      href="/notifications"
      aria-label={count > 0 ? `알림 ${count}건` : "알림"}
      className="relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--rule)] transition-colors hover:border-[color:var(--pay)]/40"
    >
      <BellIcon />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-[color:var(--danger)] px-1 font-mono text-[9.5px] font-bold tabular-nums text-white shadow-sm">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

function BellIcon() {
  return (
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
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}
