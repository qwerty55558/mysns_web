"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { ConversationsQuery } from "./queries";
import { Avatar } from "./Avatar";

export function ConversationList() {
  const { data, loading, error } = useQuery(ConversationsQuery, {
    variables: { limit: 30, offset: 0 },
    fetchPolicy: "cache-and-network",
    pollInterval: 20_000,
  });

  if (loading && !data)
    return <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>;
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );

  const conversations = data?.conversations ?? [];

  if (conversations.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-[color:var(--rule)] py-12 text-center">
        <p className="text-[13.5px] font-medium">아직 대화가 없어요</p>
        <p className="text-[12px] text-[color:var(--ink-soft)]">
          팔로잉한 친구에게 첫 메시지를 보내보세요.
        </p>
        <Link
          href="/messages/new"
          className="rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter] hover:brightness-105"
        >
          새 메시지
        </Link>
      </div>
    );

  return (
    <ul className="flex flex-col divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
      {conversations.map((c) => {
        const preview = c.lastMessage
          ? c.lastMessage.text
            ? c.lastMessage.text
            : "📷 게시물을 공유했어요"
          : "대화를 시작해보세요";
        const unread = c.unreadCount > 0;
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--rule)]/40"
            >
              <Avatar
                avatarUrl={c.participant.avatarUrl}
                displayName={c.participant.displayName}
              />
              <div className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[13.5px] font-semibold">
                    {c.participant.username}
                  </span>
                  <time className="shrink-0 text-[11px] text-[color:var(--ink-soft)]">
                    {formatAge(c.updatedAt)}
                  </time>
                </span>
                <span className="flex items-center gap-2">
                  <span
                    className={`truncate text-[12.5px] ${
                      unread
                        ? "font-semibold text-[color:var(--foreground)]"
                        : "text-[color:var(--ink-soft)]"
                    }`}
                  >
                    {c.lastMessage?.viewerIsSender ? "나: " : ""}
                    {preview}
                  </span>
                  {unread && (
                    <span className="ml-auto inline-flex h-[18px] min-w-[18px] shrink-0 items-center justify-center rounded-full bg-[color:var(--pay)] px-1 font-mono text-[10px] font-bold tabular-nums text-[color:var(--pay-on)]">
                      {c.unreadCount > 99 ? "99+" : c.unreadCount}
                    </span>
                  )}
                </span>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function formatAge(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const m = Math.floor(Math.max(0, Date.now() - t) / 60_000);
  if (m < 1) return "방금";
  if (m < 60) return `${m}분`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}일`;
  return new Date(t).toLocaleDateString("ko-KR", { month: "2-digit", day: "2-digit" });
}
