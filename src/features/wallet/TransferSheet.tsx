"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { RecipientPicker, type Recipient } from "@/features/messages/RecipientPicker";
import { Avatar } from "@/features/messages/Avatar";
import { SendMessageMutation } from "@/features/messages/queries";
import { MyWalletQuery, TransferMutation } from "./queries";
import { SheetShell } from "./SheetShell";
import { formatWon } from "./format";

/** 송금 시트. recipient를 주면 수신자 선택 단계를 건너뛴다 (프로필/DM에서 바로 송금). */
export function TransferSheet({
  recipient,
  onClose,
}: {
  recipient?: Recipient | null;
  onClose: () => void;
}) {
  const walletRes = useQuery(MyWalletQuery, { fetchPolicy: "cache-and-network" });
  const balance = walletRes.data?.myWallet?.balance ?? 0;

  const [selected, setSelected] = useState<Recipient | null>(recipient ?? null);
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [transfer, { loading }] = useMutation(TransferMutation);
  const [sendMessage] = useMutation(SendMessageMutation);

  const value = Number(amount.replace(/[^0-9]/g, ""));
  const canSend = !!selected && value > 0 && value <= balance && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSend || !selected) return;
    setError(null);
    try {
      await transfer({
        variables: {
          input: { recipientId: selected.id, amount: value, memo: memo.trim() || null },
        },
        refetchQueries: ["MyWallet", "WalletTransactions"],
      });
      try {
        const note = memo.trim();
        await sendMessage({
          variables: {
            input: {
              recipientId: selected.id,
              text: `💸 ${formatWon(value)}을 보냈어요${note ? ` · ${note}` : ""}`,
            },
          },
          // "Messages"도 포함 → DM 대화창이 열려 있으면 active Messages 쿼리가
          // 즉시 refetch 되어 송금 메시지가 바로 뜬다(7초 폴링 대기 X).
          refetchQueries: ["Conversations", "Messages"],
        });
      } catch {
        // 자동 메시지 실패는 송금 결과에 영향 주지 않음 (무시)
      }
      onClose();
    } catch (err) {
      if (CombinedGraphQLErrors.is(err) && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("송금에 실패했습니다.");
      }
    }
  };

  return (
    <SheetShell title="송금" onClose={onClose}>
      {!selected ? (
        <div className="flex flex-col gap-3">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            받는 사람 (팔로잉)
          </h3>
          <RecipientPicker onPick={setSelected} />
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <div className="flex items-center gap-3 rounded-2xl bg-[color:var(--rule)]/25 px-3 py-2.5">
            <Avatar avatarUrl={selected.avatarUrl} displayName={selected.displayName} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-[13.5px] font-semibold">{selected.username}</p>
              <p className="truncate text-[12px] text-[color:var(--ink-soft)]">
                {selected.displayName}
              </p>
            </div>
            {!recipient && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="no-scale rounded-full border border-[color:var(--rule)] px-3 py-1 text-[11.5px] text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
              >
                변경
              </button>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <div className="flex items-end gap-1 border-b border-[color:var(--rule)] pb-2">
              <span className="text-[22px] font-semibold text-[color:var(--ink-soft)]">₩</span>
              <input
                value={value ? value.toLocaleString() : ""}
                onChange={(e) => {
                  setAmount(e.target.value);
                  if (error) setError(null);
                }}
                inputMode="numeric"
                autoFocus
                placeholder="0"
                className="w-full bg-transparent text-[26px] font-semibold tabular-nums outline-none placeholder:text-[color:var(--ink-soft)]/40"
              />
            </div>
            <p className="text-[11.5px] text-[color:var(--ink-soft)]">
              송금 가능 잔액 {formatWon(balance)}
            </p>
          </div>

          <input
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="메모 (선택)"
            maxLength={140}
            className="rounded-full border border-[color:var(--rule)] bg-[color:var(--background)] px-4 py-2.5 text-[13.5px] outline-none focus:border-[color:var(--foreground)]/40"
          />

          {value > balance && (
            <p className="text-[12px] text-[color:var(--danger)]">잔액이 부족합니다.</p>
          )}
          {error && (
            <p role="alert" className="text-[12px] text-[color:var(--danger)]">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSend}
            className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
          >
            {loading
              ? "송금 중…"
              : value > 0
                ? `${formatWon(value)} 보내기`
                : "보내기"}
          </button>
        </form>
      )}
    </SheetShell>
  );
}
