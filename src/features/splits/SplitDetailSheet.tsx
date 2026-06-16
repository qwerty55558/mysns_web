"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import { Avatar } from "@/features/messages/Avatar";
import { SheetShell } from "@/features/wallet/SheetShell";
import {
  AcceptSplitMutation,
  CancelSplitMutation,
  DeclineSplitMutation,
  SplitBillQuery,
} from "./queries";
import {
  billStatusLabel,
  formatWon,
  participantStatusLabel,
  statusTone,
  timeAgo,
} from "./format";

const REFETCH = ["MySplitBills", "PendingSplitRequests", "MyWallet", "SplitBill"];

export function SplitDetailSheet({
  billId,
  viewerRole,
  onClose,
}: {
  billId: string;
  viewerRole: "creator" | "participant";
  onClose: () => void;
}) {
  const { data, loading } = useQuery(SplitBillQuery, {
    variables: { id: billId },
    fetchPolicy: "cache-and-network",
  });
  const [error, setError] = useState<string | null>(null);

  const [accept, acceptState] = useMutation(AcceptSplitMutation);
  const [decline, declineState] = useMutation(DeclineSplitMutation);
  const [cancel, cancelState] = useMutation(CancelSplitMutation);
  const busy = acceptState.loading || declineState.loading || cancelState.loading;

  const bill = data?.splitBill;

  const run = async (
    fn:
      | typeof accept
      | typeof decline
      | typeof cancel,
    closeAfter = true,
  ) => {
    setError(null);
    try {
      await fn({ variables: { splitBillId: billId }, refetchQueries: REFETCH });
      if (closeAfter) onClose();
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
    <SheetShell title="정산 상세" onClose={onClose}>
      {loading && !bill && (
        <p className="py-8 text-center text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
      )}
      {!loading && !bill && (
        <p className="py-8 text-center text-sm text-[color:var(--ink-soft)]">
          정산을 찾을 수 없어요.
        </p>
      )}

      {bill && (
        <div className="flex flex-col gap-4">
          <section className="bg-pay-gradient relative overflow-hidden rounded-3xl p-5 text-[color:var(--pay-on)]">
            <div className="flex items-center justify-between">
              <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">총 금액</p>
              <StatusChip label={billStatusLabel(bill.status)} status={bill.status} onGradient />
            </div>
            <p className="mt-1 text-[30px] font-bold tabular-nums">
              {formatWon(bill.totalAmount)}
            </p>
            <div className="mt-3 flex items-center gap-2">
              <Avatar
                avatarUrl={bill.creator.avatarUrl}
                displayName={bill.creator.displayName}
                size={28}
              />
              <p className="text-[12.5px] opacity-90">
                {bill.creator.username}님 개설 · {timeAgo(bill.createdAt)}
              </p>
            </div>
            {bill.memo && <p className="mt-2 text-[13px] opacity-95">“{bill.memo}”</p>}
          </section>

          <section className="flex flex-col gap-2">
            <h3 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
              참가자
            </h3>
            <ul className="flex flex-col divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
              {bill.participants.map((p) => (
                <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar
                    avatarUrl={p.user.avatarUrl}
                    displayName={p.user.displayName}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13.5px] font-medium">
                      {p.user.username}
                      {p.isCreator && (
                        <span className="ml-1.5 text-[11px] text-[color:var(--ink-soft)]">
                          개설자
                        </span>
                      )}
                    </p>
                    <p className="truncate text-[11.5px] text-[color:var(--ink-soft)] tabular-nums">
                      {p.percent}% · {formatWon(p.shareAmount)}
                    </p>
                  </div>
                  {p.isCreator ? (
                    <span className="text-[11.5px] text-[color:var(--ink-soft)]">본인 부담</span>
                  ) : (
                    <StatusChip
                      label={participantStatusLabel(p.status)}
                      status={p.status}
                    />
                  )}
                </li>
              ))}
            </ul>
          </section>

          {error && (
            <p role="alert" className="text-[12px] text-[color:var(--danger)]">
              {error}
            </p>
          )}

          {bill.status === "OPEN" && viewerRole === "participant" && (
            <div className="flex gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => run(decline)}
                className="no-scale flex-1 rounded-full border border-[color:var(--rule)] py-3 text-[14px] font-semibold text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)] disabled:opacity-40"
              >
                거절
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => run(accept)}
                className="flex-[2] rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {busy ? "처리 중…" : "수락하고 보내기"}
              </button>
            </div>
          )}

          {bill.status === "OPEN" && viewerRole === "creator" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run(cancel)}
              className="no-scale w-full rounded-full border border-[color:var(--danger)]/40 py-3 text-[14px] font-semibold text-[color:var(--danger)] transition-colors hover:bg-[color:var(--danger)]/5 disabled:opacity-40"
            >
              {busy ? "처리 중…" : "정산 취소"}
            </button>
          )}
        </div>
      )}
    </SheetShell>
  );
}

function StatusChip({
  label,
  status,
  onGradient = false,
}: {
  label: string;
  status: Parameters<typeof statusTone>[0];
  onGradient?: boolean;
}) {
  if (onGradient) {
    return (
      <span className="rounded-full bg-white/25 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur">
        {label}
      </span>
    );
  }
  const tone = statusTone(status);
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
      style={{ color: tone.fg, backgroundColor: tone.bg }}
    >
      {label}
    </span>
  );
}
