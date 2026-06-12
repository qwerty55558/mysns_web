"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { ConversationsQuery, SendMessageMutation } from "./queries";
import { RecipientPicker, type Recipient } from "./RecipientPicker";
import { Avatar } from "./Avatar";

type Props = {
  postId: string;
  open: boolean;
  onClose: () => void;
};

export function ShareToDirectSheet({ postId, open, onClose }: Props) {
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data } = useQuery(ConversationsQuery, {
    variables: { limit: 20, offset: 0 },
    skip: !open,
    fetchPolicy: "cache-and-network",
  });
  const [send] = useMutation(SendMessageMutation);

  useEffect(() => {
    if (!open) return;
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
  }, [open, onClose]);

  if (!open) return null;

  const conversations = data?.conversations ?? [];

  const sendTo = async (userId: string) => {
    if (sendingId || sentIds.has(userId)) return;
    setSendingId(userId);
    setError(null);
    try {
      await send({
        variables: { input: { recipientId: userId, sharedPostId: postId } },
        refetchQueries: ["Conversations"],
      });
      setSentIds((s) => new Set(s).add(userId));
    } catch (err) {
      if (CombinedGraphQLErrors.is(err) && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("전송에 실패했습니다.");
      }
    } finally {
      setSendingId(null);
    }
  };

  const onPickFollowing = (u: Recipient) => void sendTo(u.id);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="게시물 공유"
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="flex max-h-[80vh] w-full max-w-md flex-col overflow-hidden rounded-t-2xl bg-[color:var(--paper)] shadow-2xl sm:rounded-2xl"
        style={{ height: "min(70vh, 560px)" }}
      >
        <header className="flex items-center justify-between border-b border-[color:var(--rule)] px-5 py-3">
          <span className="text-[14px] font-semibold">공유</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="text-[20px] text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ×
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-4 py-3">
          {error && (
            <p className="mb-2 px-1 text-[12px] text-[color:var(--danger)]">{error}</p>
          )}

          {conversations.length > 0 && (
            <section className="mb-3 flex flex-col gap-1">
              <h3 className="px-1 py-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
                최근 대화
              </h3>
              {conversations.map((c) => (
                <RecipientRow
                  key={c.id}
                  id={c.participant.id}
                  username={c.participant.username}
                  displayName={c.participant.displayName}
                  avatarUrl={c.participant.avatarUrl}
                  sent={sentIds.has(c.participant.id)}
                  sending={sendingId === c.participant.id}
                  onSend={() => sendTo(c.participant.id)}
                />
              ))}
            </section>
          )}

          <section className="flex flex-col gap-2">
            <h3 className="px-1 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
              {conversations.length > 0 ? "팔로잉" : "팔로잉에게 보내기"}
            </h3>
            <RecipientPicker onPick={onPickFollowing} />
          </section>
        </div>
      </div>
    </div>
  );
}

function RecipientRow({
  username,
  displayName,
  avatarUrl,
  sent,
  sending,
  onSend,
}: {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  sent: boolean;
  sending: boolean;
  onSend: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl px-2 py-2">
      <Avatar avatarUrl={avatarUrl} displayName={displayName} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13.5px] font-semibold">{username}</p>
        <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
          {displayName}
        </p>
      </div>
      <button
        type="button"
        onClick={onSend}
        disabled={sent || sending}
        className={`rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition-[filter] ${
          sent
            ? "bg-[color:var(--rule)]/50 text-[color:var(--ink-soft)]"
            : "bg-pay text-[color:var(--pay-on)] shadow-[0_4px_14px_-8px_rgba(3,199,90,0.7)] hover:brightness-105 disabled:opacity-60"
        }`}
      >
        {sent ? "보냄 ✓" : sending ? "…" : "보내기"}
      </button>
    </div>
  );
}
