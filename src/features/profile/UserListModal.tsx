"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { Avatar } from "@/features/messages/Avatar";

export type ConnTab = "followers" | "following";

const ProfileFollowsQuery = graphql(`
  query ProfileFollows($username: String!, $limit: Int!, $offset: Int!) {
    userByUsername(username: $username) {
      id
      followers(limit: $limit, offset: $offset) {
        id
        username
        displayName
        avatarUrl
      }
      following(limit: $limit, offset: $offset) {
        id
        username
        displayName
        avatarUrl
      }
    }
  }
`);

export function UserListModal({
  username,
  tab,
  onTabChange,
  onClose,
}: {
  username: string;
  tab: ConnTab;
  onTabChange: (tab: ConnTab) => void;
  onClose: () => void;
}) {
  const { data, loading, error } = useQuery(ProfileFollowsQuery, {
    variables: { username, limit: 50, offset: 0 },
    fetchPolicy: "cache-and-network",
  });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const list =
    (tab === "followers"
      ? data?.userByUsername?.followers
      : data?.userByUsername?.following) ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tab === "followers" ? "팔로워" : "팔로잉"}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[color:var(--paper)] shadow-2xl sm:rounded-2xl"
        style={{ height: "min(70vh, 560px)" }}
      >
        <header className="flex items-center border-b border-[color:var(--rule)]">
          <TabButton
            active={tab === "followers"}
            onClick={() => onTabChange("followers")}
          >
            팔로워
          </TabButton>
          <TabButton
            active={tab === "following"}
            onClick={() => onTabChange("following")}
          >
            팔로잉
          </TabButton>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="px-4 text-[20px] text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loading && !data && (
            <p className="px-3 py-8 text-center text-[13px] text-[color:var(--ink-soft)]">
              불러오는 중…
            </p>
          )}
          {error && (
            <p className="px-3 py-8 text-center text-[13px] text-[color:var(--danger)]">
              에러: {error.message}
            </p>
          )}
          {!loading && list.length === 0 && (
            <p className="px-3 py-12 text-center text-[13px] text-[color:var(--ink-soft)]">
              {tab === "followers"
                ? "아직 팔로워가 없어요."
                : "아직 팔로잉이 없어요."}
            </p>
          )}
          <ul className="flex flex-col">
            {list.map((u) => (
              <li key={u.id}>
                <Link
                  href={`/u/${u.username}`}
                  onClick={onClose}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-[color:var(--rule)]/40"
                >
                  <Avatar avatarUrl={u.avatarUrl} displayName={u.displayName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-semibold">
                      {u.username}
                    </p>
                    <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
                      {u.displayName}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 py-3 text-[13px] font-semibold transition-colors ${
        active
          ? "border-b-2 border-[color:var(--foreground)] text-[color:var(--foreground)]"
          : "text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
      }`}
    >
      {children}
    </button>
  );
}
