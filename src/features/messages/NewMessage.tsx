"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { RecipientPicker, type Recipient } from "./RecipientPicker";
import { SendMessageMutation } from "./queries";
import { Avatar } from "./Avatar";

export function NewMessage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Recipient | null>(null);
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [send, { loading }] = useMutation(SendMessageMutation);

  if (!selected) {
    return (
      <section className="flex flex-col gap-3 rounded-2xl bg-[color:var(--paper)] p-4 ring-1 ring-black/5">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          받는 사람 (팔로잉)
        </h2>
        <RecipientPicker onPick={setSelected} />
      </section>
    );
  }

  const trimmed = text.trim();
  const canSend = trimmed.length > 0 && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend) return;
    setError(null);
    try {
      const res = await send({
        variables: { input: { recipientId: selected.id, text: trimmed } },
        refetchQueries: ["Conversations", "UnreadMessageCount"],
      });
      const conversationId = res.data?.sendMessage?.conversationId;
      if (conversationId) router.push(`/messages/${conversationId}`);
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
    <section className="flex flex-col gap-3 rounded-2xl bg-[color:var(--paper)] p-4 ring-1 ring-black/5">
      <div className="flex items-center gap-3">
        <Avatar avatarUrl={selected.avatarUrl} displayName={selected.displayName} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-semibold">{selected.username}</p>
          <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
            {selected.displayName}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="rounded-full border border-[color:var(--rule)] px-3 py-1 text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)]"
        >
          변경
        </button>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <input
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              if (error) setError(null);
            }}
            autoFocus
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
    </section>
  );
}
