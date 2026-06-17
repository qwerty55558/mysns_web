"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { Avatar } from "@/features/messages/Avatar";
import {
  MyWalletQuery,
  TopUpWalletMutation,
  WalletTransactionsQuery,
  WithdrawWalletMutation,
} from "./queries";
import { TransferSheet } from "./TransferSheet";
import { SheetShell } from "./SheetShell";
import { formatWon } from "./format";
import { SubscriptionEntryCard } from "@/features/subscription/SubscriptionEntryCard";

const QUICK = [10_000, 50_000, 100_000, 500_000];

type Mode = "topup" | "withdraw" | "transfer" | null;

export function WalletView() {
  const walletRes = useQuery(MyWalletQuery, { fetchPolicy: "cache-and-network" });
  const txRes = useQuery(WalletTransactionsQuery, {
    variables: { limit: 30, offset: 0 },
    fetchPolicy: "cache-and-network",
  });
  const [mode, setMode] = useState<Mode>(null);

  const balance = walletRes.data?.myWallet?.balance ?? 0;
  const held = walletRes.data?.myWallet?.held ?? 0;
  const txs = txRes.data?.walletTransactions ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-pay-gradient relative overflow-hidden rounded-3xl p-5 text-[color:var(--pay-on)] shadow-[0_18px_40px_-22px_rgba(3,199,90,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">내 잔액</p>
        <p className="mt-1 text-[32px] font-bold tabular-nums">{formatWon(balance)}</p>
        {held > 0 && (
          <p className="mt-1 text-[12px] opacity-90 tabular-nums">
            1/N 예치 중 {formatWon(held)} · 정산 완료 전까지 묶여요
          </p>
        )}
        <div className="mt-4 flex gap-2">
          <ActionButton onClick={() => setMode("transfer")} primary>
            송금
          </ActionButton>
          <ActionButton onClick={() => setMode("topup")}>충전</ActionButton>
          <ActionButton onClick={() => setMode("withdraw")}>출금</ActionButton>
        </div>
      </section>

      <SubscriptionEntryCard />

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          거래내역
        </h2>
        {txRes.loading && txs.length === 0 && (
          <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
        )}
        {!txRes.loading && txs.length === 0 && (
          <p className="py-8 text-center text-sm text-[color:var(--ink-soft)]">
            아직 거래내역이 없어요. 송금하거나 충전해보세요.
          </p>
        )}
        {txs.length > 0 && (
          <ul className="flex flex-col divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
            {txs.map((tx) => {
              const positive =
                tx.type === "TOPUP" ||
                tx.type === "TRANSFER_IN" ||
                tx.type === "SPLIT_REFUND" ||
                tx.type === "SPLIT_SETTLE_IN";
              return (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3">
                  {tx.counterparty ? (
                    <Avatar
                      avatarUrl={tx.counterparty.avatarUrl}
                      displayName={tx.counterparty.displayName}
                      size={38}
                    />
                  ) : (
                    <span className="inline-flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-[color:var(--rule)]/40 text-[15px]">
                      {tx.type === "TOPUP" ? "＋" : "－"}
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">{txLabel(tx)}</p>
                    <p className="truncate text-[11.5px] text-[color:var(--ink-soft)]">
                      {tx.memo ? `${tx.memo} · ` : ""}
                      {timeAgo(tx.createdAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-[13.5px] font-semibold tabular-nums ${
                        positive
                          ? "text-[color:var(--pay-forest)]"
                          : "text-[color:var(--foreground)]"
                      }`}
                    >
                      {positive ? "+" : "−"}
                      {formatWon(tx.amount)}
                    </p>
                    <p className="text-[10.5px] text-[color:var(--ink-soft)] tabular-nums">
                      잔액 {formatWon(tx.balanceAfter)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {mode === "transfer" && <TransferSheet onClose={() => setMode(null)} />}
      {(mode === "topup" || mode === "withdraw") && (
        <AmountSheet mode={mode} balance={balance} onClose={() => setMode(null)} />
      )}
    </div>
  );
}

function AmountSheet({
  mode,
  balance,
  onClose,
}: {
  mode: "topup" | "withdraw";
  balance: number;
  onClose: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [topUp, topUpState] = useMutation(TopUpWalletMutation);
  const [withdraw, withdrawState] = useMutation(WithdrawWalletMutation);

  const isTopUp = mode === "topup";
  const loading = topUpState.loading || withdrawState.loading;
  const value = Number(amount.replace(/[^0-9]/g, ""));
  const overdraft = !isTopUp && value > balance;
  const canSubmit = value > 0 && !overdraft && !loading;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    try {
      const run = isTopUp ? topUp : withdraw;
      await run({
        variables: { amount: value },
        refetchQueries: ["MyWallet", "WalletTransactions"],
      });
      onClose();
    } catch (err) {
      if (CombinedGraphQLErrors.is(err) && err.errors.length > 0) {
        setError(err.errors[0].message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("처리에 실패했습니다.");
      }
    }
  };

  return (
    <SheetShell title={isTopUp ? "충전" : "출금"} onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
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
          {!isTopUp && (
            <p className="text-[11.5px] text-[color:var(--ink-soft)]">
              출금 가능 잔액 {formatWon(balance)}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setAmount(String(value + q))}
              className="no-scale rounded-full border border-[color:var(--rule)] px-3 py-1.5 text-[12px] font-medium text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/50 hover:text-[color:var(--foreground)]"
            >
              +{q.toLocaleString()}
            </button>
          ))}
        </div>

        {overdraft && (
          <p className="text-[12px] text-[color:var(--danger)]">잔액이 부족합니다.</p>
        )}
        {error && (
          <p role="alert" className="text-[12px] text-[color:var(--danger)]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {loading
            ? "처리 중…"
            : value > 0
              ? `${formatWon(value)} ${isTopUp ? "충전" : "출금"}`
              : isTopUp
                ? "충전"
                : "출금"}
        </button>
      </form>
    </SheetShell>
  );
}

function ActionButton({
  onClick,
  primary,
  children,
}: {
  onClick: () => void;
  primary?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`no-scale flex-1 rounded-full py-2 text-[13px] font-semibold backdrop-blur transition-colors ${
        primary
          ? "bg-white/95 text-[color:var(--pay-forest)] hover:bg-white"
          : "bg-white/20 text-white hover:bg-white/30"
      }`}
    >
      {children}
    </button>
  );
}

function txLabel(tx: {
  type: string;
  counterparty?: { username: string } | null;
}): string {
  switch (tx.type) {
    case "TOPUP":
      return "충전";
    case "WITHDRAW":
      return "출금";
    case "TRANSFER_OUT":
      return tx.counterparty ? `${tx.counterparty.username}님에게 송금` : "송금";
    case "TRANSFER_IN":
      return tx.counterparty ? `${tx.counterparty.username}님이 보냄` : "입금";
    case "SPLIT_HOLD":
      return "1/N 예치";
    case "SPLIT_REFUND":
      return "1/N 취소 환불";
    case "SPLIT_SETTLE_IN":
      return tx.counterparty
        ? `${tx.counterparty.username}님 1/N 정산`
        : "1/N 정산";
    default:
      return "거래";
  }
}

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
