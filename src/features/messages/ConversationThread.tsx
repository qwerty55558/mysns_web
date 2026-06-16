"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { toAbsoluteMediaUrl } from "@/lib/upload";
import { SendMoneyButton } from "@/features/wallet/SendMoneyButton";
import { Avatar } from "./Avatar";
import {
  ConversationQuery,
  MessagesQuery,
  SendMessageMutation,
  MarkConversationReadMutation,
} from "./queries";

const PAGE = 30;

export function ConversationThread({ id }: { id: string }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastSeenIdRef = useRef<string | null>(null);

  const convo = useQuery(ConversationQuery, { variables: { id } });
  const { data, loading, error, refetch } = useQuery(MessagesQuery, {
    variables: { conversationId: id, limit: PAGE, offset: 0 },
    fetchPolicy: "cache-and-network",
  });
  const [markRead] = useMutation(MarkConversationReadMutation);

  const participant = convo.data?.conversation?.participant;
  // messages는 최신순(DESC) → 화면은 오래된 게 위로 오도록 역순.
  const messages = data?.messages ? [...data.messages].reverse() : [];
  const newestId = data?.messages?.[0]?.id ?? null;

  // 새 메시지가 보이면 읽음 처리 + 헤더 뱃지 갱신.
  useEffect(() => {
    if (!newestId || newestId === lastSeenIdRef.current) return;
    lastSeenIdRef.current = newestId;
    void markRead({
      variables: { conversationId: id },
      refetchQueries: ["UnreadMessageCount", "Conversations"],
    });
  }, [newestId, id, markRead]);

  // 새 메시지 도착/최초 로드 시 맨 아래로 스크롤.
  useEffect(() => {
    if (!newestId) return;
    requestAnimationFrame(() => {
      const el = scrollRef.current;
      if (el) el.scrollTop = el.scrollHeight;
    });
  }, [newestId]);

  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );

  return (
    <div className="flex h-[calc(100dvh-12rem)] flex-col overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
      {participant && (
        <div className="flex items-center gap-2.5 border-b border-[color:var(--rule)] px-4 py-3">
          <Link
            href={`/u/${participant.username}`}
            className="flex min-w-0 flex-1 items-center gap-2.5 transition-colors hover:opacity-80"
          >
            <Avatar
              avatarUrl={participant.avatarUrl}
              displayName={participant.displayName}
              size={34}
            />
            <div className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-[13.5px] font-semibold">
                {participant.username}
              </span>
              <span className="truncate text-[11px] text-[color:var(--ink-soft)]">
                {participant.displayName}
              </span>
            </div>
          </Link>
          <SendMoneyButton
            user={{
              id: participant.id,
              username: participant.username,
              displayName: participant.displayName,
              avatarUrl: participant.avatarUrl,
            }}
          />
        </div>
      )}

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-4 py-4">
        {loading && messages.length === 0 && (
          <p className="py-8 text-center text-[13px] text-[color:var(--ink-soft)]">
            불러오는 중…
          </p>
        )}
        {!loading && messages.length === 0 && (
          <p className="py-12 text-center text-[13px] text-[color:var(--ink-soft)]">
            첫 메시지를 보내보세요.
          </p>
        )}
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
      </div>

      <Composer
        recipientId={participant?.id}
        onSent={() => {
          void refetch();
        }}
      />
    </div>
  );
}

type MessageData = ResultOf<typeof MessagesQuery>["messages"][number];

function MessageBubble({ message }: { message: MessageData }) {
  const mine = message.viewerIsSender;
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className="flex max-w-[78%] flex-col gap-1">
        {message.sharedPost && <SharedPostCard post={message.sharedPost} />}
        {message.text && (
          <div
            className={`rounded-2xl px-3.5 py-2 text-[13.5px] leading-snug ${
              mine
                ? "rounded-br-md bg-pay text-[color:var(--pay-on)]"
                : "rounded-bl-md bg-[color:var(--rule)]/50 text-[color:var(--foreground)]"
            }`}
          >
            {message.text}
          </div>
        )}
        <time
          className={`text-[10px] text-[color:var(--ink-soft)] ${
            mine ? "text-right" : "text-left"
          }`}
        >
          {formatTime(message.createdAt)}
        </time>
      </div>
    </div>
  );
}

function SharedPostCard({ post }: { post: NonNullable<MessageData["sharedPost"]> }) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block overflow-hidden rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] transition-colors hover:border-[color:var(--pay)]/40"
    >
      {post.imageUrls[0] && (
        <div className="relative aspect-square w-44">
          <Image
            src={toAbsoluteMediaUrl(post.imageUrls[0])}
            alt=""
            fill
            sizes="176px"
            className="object-cover"
          />
        </div>
      )}
      <div className="flex flex-col gap-0.5 px-3 py-2">
        <span className="text-[11px] font-semibold">
          @{post.author.username}
        </span>
        <span className="line-clamp-2 text-[11.5px] text-[color:var(--ink-soft)]">
          {post.content}
        </span>
      </div>
    </Link>
  );
}

function Composer({
  recipientId,
  onSent,
}: {
  recipientId?: string;
  onSent: () => void;
}) {
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [send, { loading }] = useMutation(SendMessageMutation);

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !loading && !!recipientId;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !recipientId) return;
    setError(null);
    try {
      await send({
        variables: { input: { recipientId, text: trimmed } },
        refetchQueries: ["Conversations"],
      });
      setText("");
      onSent();
    } catch (err) {
      if (CombinedGraphQLErrors.is(err) && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("전송에 실패했습니다.");
      }
    }
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-col gap-1 border-t border-[color:var(--rule)] px-4 py-3"
    >
      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (error) setError(null);
          }}
          placeholder="메시지 입력…"
          maxLength={1000}
          disabled={loading}
          className="flex-1 rounded-full border border-[color:var(--rule)] bg-[color:var(--background)] px-4 py-2 text-[13.5px] outline-none transition-colors focus:border-[color:var(--foreground)]/40 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!canSend}
          className="inline-flex items-center justify-center rounded-full bg-pay px-4 py-2 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter,transform] hover:brightness-105 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
        >
          {loading ? "…" : "보내기"}
        </button>
      </div>
      {error && (
        <p role="alert" className="px-1 text-[11.5px] text-[color:var(--danger)]">
          {error}
        </p>
      )}
    </form>
  );
}

function formatTime(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return "";
  return t.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
}
