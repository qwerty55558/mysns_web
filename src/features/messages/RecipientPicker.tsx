"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { MyFollowingQuery } from "./queries";
import { Avatar } from "./Avatar";

export type Recipient = NonNullable<
  ResultOf<typeof MyFollowingQuery>["me"]
>["following"][number];

export function RecipientPicker({
  onPick,
  emptyHint = "팔로잉한 친구가 없어요. 먼저 친구를 팔로우해보세요.",
}: {
  onPick: (user: Recipient) => void;
  emptyHint?: string;
}) {
  const [q, setQ] = useState("");
  const { data, loading, error } = useQuery(MyFollowingQuery, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: "cache-and-network",
  });

  const following = useMemo(() => data?.me?.following ?? [], [data]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return following;
    return following.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        u.displayName.toLowerCase().includes(needle),
    );
  }, [following, q]);

  return (
    <div className="flex flex-col gap-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="이름·아이디로 검색"
        className="rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] px-4 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
      />

      {loading && !data && (
        <p className="px-1 text-[13px] text-[color:var(--ink-soft)]">불러오는 중…</p>
      )}
      {error && (
        <p className="px-1 text-[13px] text-[color:var(--danger)]">
          에러: {error.message}
        </p>
      )}
      {!loading && following.length === 0 && (
        <p className="px-1 py-6 text-center text-[13px] text-[color:var(--ink-soft)]">
          {emptyHint}
        </p>
      )}
      {following.length > 0 && filtered.length === 0 && (
        <p className="px-1 py-6 text-center text-[13px] text-[color:var(--ink-soft)]">
          검색 결과가 없어요.
        </p>
      )}

      <ul className="flex flex-col">
        {filtered.map((u) => (
          <li key={u.id}>
            <button
              type="button"
              onClick={() => onPick(u)}
              className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[color:var(--rule)]/40"
            >
              <Avatar avatarUrl={u.avatarUrl} displayName={u.displayName} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13.5px] font-semibold">{u.username}</p>
                <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
                  {u.displayName}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
