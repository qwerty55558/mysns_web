"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useMutation, useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { toAbsoluteMediaUrl } from "@/lib/upload";
import type { NotificationType } from "@/gql/graphql";

const PAGE_SIZE = 20;

const NotificationsQuery = graphql(`
  query Notifications($limit: Int!, $offset: Int!) {
    notifications(limit: $limit, offset: $offset) {
      id
      type
      read
      createdAt
      actor {
        id
        username
        displayName
        avatarUrl
      }
      post {
        id
        imageUrls
      }
      comment {
        id
        content
      }
    }
  }
`);

const MarkNotificationReadMutation = graphql(`
  mutation MarkNotificationRead($id: ID!) {
    markNotificationRead(id: $id)
  }
`);

const MarkAllNotificationsReadMutation = graphql(`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`);

type NotificationRow = {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  actor: {
    id: string;
    username: string;
    displayName: string;
    avatarUrl?: string | null;
  };
  post?: { id: string; imageUrls: string[] } | null;
  comment?: { id: string; content: string } | null;
};

export function NotificationsList() {
  const { data, loading, error, fetchMore } = useQuery(NotificationsQuery, {
    variables: { limit: PAGE_SIZE, offset: 0 },
    fetchPolicy: "cache-and-network",
    notifyOnNetworkStatusChange: true,
  });
  const [markRead] = useMutation(MarkNotificationReadMutation);
  const [markAll] = useMutation(MarkAllNotificationsReadMutation);

  // 팔로우 요청은 상단 전용 섹션에서 승낙/거절로 처리하므로 피드에선 제외 (중복 방지).
  const items = ((data?.notifications ?? []) as NotificationRow[]).filter(
    (n) => n.type !== "FOLLOW_REQUEST",
  );
  const hasUnread = items.some((n) => !n.read);

  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const rawCount = data?.notifications?.length ?? 0;

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (loadingRef.current || rawCount === 0) return;

        loadingRef.current = true;
        setLoadingMore(true);
        fetchMore({
          variables: { limit: PAGE_SIZE, offset: rawCount },
          updateQuery: (prev, { fetchMoreResult }) => {
            const next = fetchMoreResult?.notifications ?? [];
            if (next.length < PAGE_SIZE) setHasMore(false);
            if (next.length === 0) return prev;
            const known = new Set(prev.notifications.map((n) => n.id));
            return {
              notifications: [
                ...prev.notifications,
                ...next.filter((n) => !known.has(n.id)),
              ],
            };
          },
        }).finally(() => {
          loadingRef.current = false;
          setLoadingMore(false);
        });
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [rawCount, hasMore, fetchMore]);

  const onMarkAll = () =>
    markAll({
      update(cache) {
        cache.modify({
          fields: {
            unreadNotificationCount: () => 0,
          },
        });
        items.forEach((n) => {
          if (n.read) return;
          cache.modify({
            id: cache.identify({ __typename: "Notification", id: n.id }),
            fields: { read: () => true },
          });
        });
      },
    });

  const onRowClick = (n: NotificationRow) => {
    if (n.read) return;
    void markRead({
      variables: { id: n.id },
      update(cache) {
        cache.modify({
          id: cache.identify({ __typename: "Notification", id: n.id }),
          fields: { read: () => true },
        });
        cache.modify({
          fields: {
            unreadNotificationCount: (existing) =>
              Math.max(0, (typeof existing === "number" ? existing : 0) - 1),
          },
        });
      },
    });
  };

  if (loading && !data)
    return <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>;
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );
  if (items.length === 0)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">
        아직 새로운 소식이 없습니다.
      </p>
    );

  return (
    <div className="flex flex-col gap-2">
      {hasUnread && (
        <button
          type="button"
          onClick={onMarkAll}
          className="self-end text-[11.5px] font-medium text-[color:var(--pay-forest)] transition-colors hover:text-[color:var(--pay)]"
        >
          모두 읽음
        </button>
      )}
      <ul className="flex flex-col divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
        {items.map((n) => {
          const target = rowHref(n);
          const body = (
            <>
              <span className="bg-pay-gradient inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full p-[2px]">
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12.5px] font-semibold">
                  {n.actor.avatarUrl ? (
                    <Image
                      src={toAbsoluteMediaUrl(n.actor.avatarUrl)}
                      alt=""
                      width={40}
                      height={40}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    n.actor.displayName.charAt(0).toUpperCase()
                  )}
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] leading-snug">
                  <span className="font-semibold">{n.actor.username}</span>{" "}
                  <span className="text-[color:var(--ink-soft)]">
                    {messageFor(n.type)}
                  </span>
                </p>
                {n.comment?.content && (
                  <p className="mt-0.5 truncate text-[12px] text-[color:var(--ink-soft)]">
                    “{n.comment.content}”
                  </p>
                )}
                <p className="mt-0.5 text-[11px] text-[color:var(--ink-soft)]/70">
                  {timeAgo(n.createdAt)}
                </p>
              </div>
              {n.post?.imageUrls?.[0] && (
                <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-md bg-[color:var(--rule)]">
                  <Image
                    src={n.post.imageUrls[0]}
                    alt=""
                    fill
                    className="object-cover"
                  />
                </span>
              )}
              {!n.read && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--pay)]" />
              )}
            </>
          );

          const className = `flex items-center gap-3 px-4 py-3 transition-colors hover:bg-black/[0.015] ${
            n.read ? "" : "bg-[color:var(--pay)]/[0.04]"
          }`;

          return (
            <li key={n.id}>
              {target ? (
                <Link
                  href={target}
                  onClick={() => onRowClick(n)}
                  className={className}
                >
                  {body}
                </Link>
              ) : (
                <div className={className}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>

      {hasMore && rawCount > 0 && (
        <div
          ref={sentinelRef}
          className="flex h-10 items-center justify-center text-[12px] text-[color:var(--ink-soft)]"
        >
          {loadingMore ? "더 불러오는 중…" : ""}
        </div>
      )}
    </div>
  );
}

function rowHref(n: NotificationRow): string | null {
  switch (n.type) {
    case "FOLLOW":
    case "FOLLOW_ACCEPTED":
      return `/u/${n.actor.username}`;
    case "POST_LIKE":
    case "COMMENT":
    case "COMMENT_LIKE":
      return n.post ? `/posts/${n.post.id}` : null;
    default:
      return null;
  }
}

function messageFor(type: NotificationType): string {
  switch (type) {
    case "FOLLOW":
      return "님이 회원님을 팔로우하기 시작했어요.";
    case "FOLLOW_ACCEPTED":
      return "님이 회원님의 팔로우 요청을 수락했어요.";
    case "POST_LIKE":
      return "님이 회원님의 게시물을 좋아합니다.";
    case "COMMENT":
      return "님이 회원님의 게시물에 댓글을 남겼어요.";
    case "COMMENT_LIKE":
      return "님이 회원님의 댓글을 좋아합니다.";
    default:
      return "님의 새로운 소식이 있어요.";
  }
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const diff = Date.now() - t;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const wk = Math.floor(day / 7);
  if (wk < 5) return `${wk}주 전`;
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
