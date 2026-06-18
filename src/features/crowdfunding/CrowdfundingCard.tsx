"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import type { CrowdfundingStatus, BackingStatus } from "@/gql/graphql";
import { formatWon } from "@/features/wallet/format";

const BackCrowdfundingMutation = graphql(`
  mutation BackCrowdfunding($crowdfundingId: ID!, $amount: Int!) {
    backCrowdfunding(crowdfundingId: $crowdfundingId, amount: $amount) {
      id
      currentAmount
      backerCount
      progressPercent
      status
      canCloseEarly
      viewerBacking { id amount status }
    }
  }
`);

const CancelBackingMutation = graphql(`
  mutation CancelBacking($crowdfundingId: ID!) {
    cancelBacking(crowdfundingId: $crowdfundingId) {
      id
      currentAmount
      backerCount
      progressPercent
      status
      canCloseEarly
      viewerBacking { id amount status }
    }
  }
`);

const CloseCrowdfundingMutation = graphql(`
  mutation CloseCrowdfunding($crowdfundingId: ID!) {
    closeCrowdfunding(crowdfundingId: $crowdfundingId) {
      id
      status
      settledAt
      canCloseEarly
    }
  }
`);

export type CrowdfundingCardData = {
  id: string;
  goalAmount: number;
  currentAmount: number;
  backerCount: number;
  progressPercent: number;
  status: CrowdfundingStatus;
  deadline: string;
  canCloseEarly: boolean;
  viewerBacking: { id: string; amount: number; status: BackingStatus } | null;
};

export function CrowdfundingCard({
  cf,
  isCreator,
}: {
  cf: CrowdfundingCardData;
  isCreator: boolean;
}) {
  const [back, { loading: backing }] = useMutation(BackCrowdfundingMutation);
  const [cancel, { loading: cancelling }] = useMutation(CancelBackingMutation);
  const [close, { loading: closing }] = useMutation(CloseCrowdfundingMutation);
  const [openInput, setOpenInput] = useState(false);
  const [amt, setAmt] = useState("");

  const pct = Math.min(100, Math.max(0, cf.progressPercent));
  const isOpen = cf.status === "OPEN";
  const hasActiveBacking = cf.viewerBacking?.status === "ACTIVE";
  const busy = backing || cancelling || closing;

  const deadlineLabel = new Date(cf.deadline).toLocaleString("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const statusLabel =
    cf.status === "SUCCEEDED"
      ? "🎉 목표 달성"
      : cf.status === "FAILED"
        ? "무산 (목표 미달)"
        : `${deadlineLabel} 마감`;

  const onBack = async () => {
    const n = Number(amt.replace(/[^0-9]/g, ""));
    if (!n) return;
    try {
      await back({ variables: { crowdfundingId: cf.id, amount: n } });
      setOpenInput(false);
      setAmt("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "후원 실패");
    }
  };
  const onCancel = async () => {
    if (!window.confirm("후원을 취소할까요? 예치금이 환불됩니다.")) return;
    try {
      await cancel({ variables: { crowdfundingId: cf.id } });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "취소 실패");
    }
  };
  const onCloseEarly = async () => {
    if (!window.confirm("지금 마감할까요? 목표 달성 시 정산됩니다.")) return;
    try {
      await close({ variables: { crowdfundingId: cf.id } });
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "마감 실패");
    }
  };

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] p-3.5">
      <div className="flex items-baseline justify-between">
        <span className="text-[13px] font-semibold">크라우드펀딩</span>
        <span className="text-[11.5px] text-[color:var(--ink-soft)]">{statusLabel}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--rule)]/60">
        <div
          className="h-full rounded-full bg-pay transition-[width]"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between text-[12.5px]">
        <span className="font-mono font-semibold tabular-nums">
          {formatWon(cf.currentAmount)}{" "}
          <span className="text-[color:var(--ink-soft)]">
            / {formatWon(cf.goalAmount)}
          </span>
        </span>
        <span className="text-[color:var(--ink-soft)]">
          {pct}% · {cf.backerCount}명
        </span>
      </div>

      {isOpen && !isCreator && !hasActiveBacking && !openInput && (
        <button
          type="button"
          onClick={() => setOpenInput(true)}
          className="rounded-full bg-pay px-4 py-2 text-[13px] font-semibold text-[color:var(--pay-on)] transition-[filter] hover:brightness-105"
        >
          후원하기
        </button>
      )}
      {isOpen && !isCreator && openInput && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={amt}
            onChange={(e) => setAmt(e.target.value.replace(/[^0-9]/g, ""))}
            placeholder="후원 금액(원)"
            autoFocus
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-right font-mono text-[13px] tabular-nums outline-none focus:border-[color:var(--foreground)]/40"
          />
          <button
            type="button"
            disabled={busy || !amt}
            onClick={onBack}
            className="rounded-full bg-pay px-4 py-2 text-[13px] font-semibold text-[color:var(--pay-on)] transition-[filter] hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {backing ? "후원 중…" : "후원"}
          </button>
        </div>
      )}
      {hasActiveBacking && cf.viewerBacking && (
        <div className="flex items-center justify-between rounded-md bg-[color:var(--rule)]/30 px-3 py-2 text-[12.5px]">
          <span>{formatWon(cf.viewerBacking.amount)} 후원 중</span>
          {isOpen && (
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="text-[11.5px] font-medium text-[color:var(--danger)] hover:underline disabled:opacity-50"
            >
              {cancelling ? "취소 중…" : "후원 취소"}
            </button>
          )}
        </div>
      )}
      {isOpen && isCreator && cf.canCloseEarly && (
        <button
          type="button"
          disabled={busy}
          onClick={onCloseEarly}
          className="rounded-full border border-[color:var(--rule)] px-4 py-2 text-[13px] font-medium transition-colors hover:border-[color:var(--pay)]/50 disabled:opacity-50"
        >
          {closing ? "마감 중…" : "조기 마감"}
        </button>
      )}
    </div>
  );
}
