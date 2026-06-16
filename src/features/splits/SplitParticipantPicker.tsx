"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@apollo/client/react";
import { MyFollowingQuery } from "@/features/messages/queries";
import { Avatar } from "@/features/messages/Avatar";
import { SheetShell } from "@/features/wallet/SheetShell";
import { formatWon } from "@/features/wallet/format";
import { SplitUserSearchQuery } from "./queries";

export type Friend = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

type Props = {
  amount: number;
  initialSelected: Friend[];
  onConfirm: (list: Friend[]) => void;
  onClose: () => void;
};

export function SplitParticipantPicker({
  amount,
  initialSelected,
  onConfirm,
  onClose,
}: Props) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Friend[]>(initialSelected);

  const { data: followingData, loading: loadingFollowing } = useQuery(
    MyFollowingQuery,
    { variables: { limit: 50, offset: 0 }, fetchPolicy: "cache-and-network" },
  );
  const meId = followingData?.me?.id ?? null;
  const following: Friend[] = useMemo(
    () => (followingData?.me?.following ?? []).map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatarUrl: u.avatarUrl,
    })),
    [followingData],
  );

  const trimmedQ = q.trim();
  const { data: searchData } = useQuery(SplitUserSearchQuery, {
    variables: { query: trimmedQ },
    skip: trimmedQ === "",
    fetchPolicy: "cache-and-network",
  });

  const displayList: Friend[] = useMemo(() => {
    if (trimmedQ === "") return following;

    const searchResults: Friend[] = (searchData?.searchUsers ?? [])
      .filter(
        (u) =>
          (u.viewerIsFollowing || !u.privateAccount) &&
          u.id !== meId,
      )
      .map((u) => ({
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      }));

    // Merge: following first, then search results not already in following
    const followingIds = new Set(following.map((u) => u.id));
    const extra = searchResults.filter((u) => !followingIds.has(u.id));

    // Filter following by search query as well
    const needle = trimmedQ.toLowerCase();
    const filteredFollowing = following.filter(
      (u) =>
        u.username.toLowerCase().includes(needle) ||
        u.displayName.toLowerCase().includes(needle),
    );

    const seen = new Set(filteredFollowing.map((u) => u.id));
    const merged = [...filteredFollowing];
    for (const u of extra) {
      if (!seen.has(u.id)) {
        seen.add(u.id);
        merged.push(u);
      }
    }
    return merged;
  }, [trimmedQ, following, searchData, meId]);

  const toggle = (u: Friend) => {
    setSelected((cur) =>
      cur.some((p) => p.id === u.id)
        ? cur.filter((p) => p.id !== u.id)
        : [...cur, u],
    );
  };

  const headcount = selected.length + 1;
  const perHead = headcount > 0 && amount > 0 ? Math.floor(amount / headcount) : 0;

  return (
    <SheetShell title="정산 대상 선택" onClose={onClose}>
      <div className="flex flex-col gap-4">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="이름·아이디로 검색"
          className="rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] px-4 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
        />

        {amount > 0 && selected.length > 0 && (
          <p className="text-[11.5px] text-[color:var(--ink-soft)]">
            나 포함 {headcount}명 · 1인당 약 {formatWon(perHead)}
            <span className="opacity-70"> (내 몫은 청구되지 않아요)</span>
          </p>
        )}

        <div className="flex flex-col gap-1">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            정산 대상 {selected.length > 0 && `(${selected.length})`}
          </h3>

          {loadingFollowing && following.length === 0 && (
            <p className="px-1 text-[13px] text-[color:var(--ink-soft)]">불러오는 중…</p>
          )}
          {!loadingFollowing && following.length === 0 && trimmedQ === "" && (
            <p className="px-1 py-6 text-center text-[13px] text-[color:var(--ink-soft)]">
              팔로잉한 친구가 없어요. 먼저 친구를 팔로우해보세요.
            </p>
          )}
          {displayList.length === 0 && (trimmedQ !== "" || following.length > 0) && (
            <p className="px-1 py-6 text-center text-[13px] text-[color:var(--ink-soft)]">
              검색 결과가 없어요.
            </p>
          )}

          <ul className="no-scrollbar flex max-h-[34vh] flex-col overflow-y-auto">
            {displayList.map((u) => {
              const on = selected.some((p) => p.id === u.id);
              return (
                <li key={u.id}>
                  <button
                    type="button"
                    onClick={() => toggle(u)}
                    aria-pressed={on}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition-colors hover:bg-[color:var(--rule)]/40"
                  >
                    <Avatar avatarUrl={u.avatarUrl} displayName={u.displayName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[13.5px] font-semibold">{u.username}</p>
                      <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
                        {u.displayName}
                      </p>
                    </div>
                    <span
                      className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] ${
                        on
                          ? "border-transparent bg-pay text-[color:var(--pay-on)]"
                          : "border-[color:var(--rule)] text-transparent"
                      }`}
                      aria-hidden
                    >
                      ✓
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <button
          type="button"
          onClick={() => onConfirm(selected)}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105"
        >
          확인{selected.length > 0 ? ` (${selected.length}명)` : ""}
        </button>
      </div>
    </SheetShell>
  );
}
