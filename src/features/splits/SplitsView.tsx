"use client";

import { useState } from "react";
import { useQuery } from "@apollo/client/react";
import type { ResultOf } from "@graphql-typed-document-node/core";
import { Avatar } from "@/features/messages/Avatar";
import { SplitDetailSheet } from "./SplitDetailSheet";
import { MySplitBillsQuery, PendingSplitRequestsQuery } from "./queries";
import { billStatusLabel, formatWon, statusTone, timeAgo } from "./format";

type MyBill = ResultOf<typeof MySplitBillsQuery>["mySplitBills"][number];
type PendingReq =
  ResultOf<typeof PendingSplitRequestsQuery>["pendingSplitRequests"][number];

type Detail = { billId: string; role: "creator" | "participant" };

export function SplitsView() {
  const pendingRes = useQuery(PendingSplitRequestsQuery, {
    variables: { limit: 50, offset: 0 },
    fetchPolicy: "cache-and-network",
  });
  const billsRes = useQuery(MySplitBillsQuery, {
    variables: { limit: 30, offset: 0 },
    fetchPolicy: "cache-and-network",
  });

  const [detail, setDetail] = useState<Detail | null>(null);

  const pending = (pendingRes.data?.pendingSplitRequests ?? []).filter((r) => r.bill.status === "OPEN");
  const bills = billsRes.data?.mySplitBills ?? [];

  return (
    <div className="flex flex-col gap-6">
      <section className="bg-pay-gradient relative overflow-hidden rounded-3xl p-5 text-[color:var(--pay-on)] shadow-[0_18px_40px_-22px_rgba(3,199,90,0.8)]">
        <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">SPLIT PAY</p>
        <p className="mt-1 text-[20px] font-bold">결제는 내가, 정산은 다같이</p>
        <p className="mt-1 text-[12.5px] opacity-90">
          영수증을 올릴 때 1/N으로 정산을 요청할 수 있어요.
        </p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          받은 요청
          {pending.length > 0 && (
            <span className="ml-1 text-[color:var(--pay-forest)]">{pending.length}</span>
          )}
        </h2>
        {pendingRes.loading && pending.length === 0 && (
          <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
        )}
        {!pendingRes.loading && pending.length === 0 && (
          <p className="py-6 text-center text-sm text-[color:var(--ink-soft)]">
            대기 중인 정산 요청이 없어요.
          </p>
        )}
        {pending.length > 0 && (
          <ul className="flex flex-col gap-2">
            {pending.map((req) => (
              <PendingCard
                key={req.id}
                req={req}
                onOpen={() => setDetail({ billId: req.bill.id, role: "participant" })}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          내가 만든 정산
        </h2>
        {billsRes.loading && bills.length === 0 && (
          <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
        )}
        {!billsRes.loading && bills.length === 0 && (
          <p className="py-6 text-center text-sm text-[color:var(--ink-soft)]">
            아직 만든 정산이 없어요. 게시글에 영수증을 올리고 1/N으로 정산해보세요.
          </p>
        )}
        {bills.length > 0 && (
          <ul className="flex flex-col gap-2">
            {bills.map((bill) => (
              <BillCard
                key={bill.id}
                bill={bill}
                onOpen={() => setDetail({ billId: bill.id, role: "creator" })}
              />
            ))}
          </ul>
        )}
      </section>

      {detail && (
        <SplitDetailSheet
          billId={detail.billId}
          viewerRole={detail.role}
          onClose={() => setDetail(null)}
        />
      )}
    </div>
  );
}

function PendingCard({ req, onOpen }: { req: PendingReq; onOpen: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-left ring-1 ring-black/5 transition-colors hover:bg-[color:var(--rule)]/30"
      >
        <Avatar
          avatarUrl={req.bill.creator.avatarUrl}
          displayName={req.bill.creator.displayName}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium">
            {req.bill.creator.username}님의 정산 요청
          </p>
          <p className="truncate text-[11.5px] text-[color:var(--ink-soft)]">
            {req.bill.memo ? `${req.bill.memo} · ` : ""}
            {timeAgo(req.bill.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[14px] font-semibold tabular-nums text-[color:var(--foreground)]">
            {formatWon(req.shareAmount)}
          </p>
          <p className="text-[10.5px] text-[color:var(--ink-soft)]">내 몫</p>
        </div>
      </button>
    </li>
  );
}

function BillCard({ bill, onOpen }: { bill: MyBill; onOpen: () => void }) {
  const responders = bill.participants.filter((p) => !p.isCreator);
  const accepted = responders.filter((p) => p.status === "ACCEPTED").length;
  const tone = statusTone(bill.status);
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 rounded-2xl bg-[color:var(--paper)] px-4 py-3 text-left ring-1 ring-black/5 transition-colors hover:bg-[color:var(--rule)]/30"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-[14px] font-semibold tabular-nums">
              {formatWon(bill.totalAmount)}
            </p>
            <span
              className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
              style={{ color: tone.fg, backgroundColor: tone.bg }}
            >
              {billStatusLabel(bill.status)}
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-[color:var(--ink-soft)]">
            {bill.memo ? `${bill.memo} · ` : ""}
            {timeAgo(bill.createdAt)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[12.5px] font-medium tabular-nums">
            {accepted}/{responders.length}
          </p>
          <p className="text-[10.5px] text-[color:var(--ink-soft)]">수락</p>
        </div>
      </button>
    </li>
  );
}
