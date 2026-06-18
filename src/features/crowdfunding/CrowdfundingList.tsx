"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";
import { formatWon } from "@/features/wallet/format";

const CrowdfundingsQuery = graphql(`
  query Crowdfundings($limit: Int!, $offset: Int!) {
    crowdfundings(limit: $limit, offset: $offset) {
      id
      goalAmount
      currentAmount
      backerCount
      progressPercent
      status
      deadline
      post {
        id
        content
        author {
          username
          displayName
        }
      }
    }
  }
`);

export function CrowdfundingList() {
  const { data, loading, error } = useQuery(CrowdfundingsQuery, {
    variables: { limit: 20, offset: 0 },
  });

  if (loading)
    return <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>;
  if (error)
    return <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>;

  const items = data?.crowdfundings ?? [];
  if (items.length === 0)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">
        진행 중인 펀딩이 없습니다.
      </p>
    );

  return (
    <div className="flex flex-col gap-3">
      <h1 className="text-lg font-semibold">크라우드펀딩</h1>
      <ul className="flex flex-col gap-3">
        {items.map((c) => {
          const pct = Math.min(100, Math.max(0, c.progressPercent));
          const statusLabel =
            c.status === "SUCCEEDED"
              ? "목표 달성"
              : c.status === "FAILED"
                ? "무산"
                : "모집 중";
          return (
            <li key={c.id}>
              <Link
                href={`/posts/${c.post.id}`}
                className="flex flex-col gap-2 rounded-2xl bg-[color:var(--paper)] p-4 ring-1 ring-black/5 transition-shadow hover:shadow-md"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-[13.5px] font-medium">
                    {c.post.content || c.post.author.displayName}
                  </span>
                  <span className="shrink-0 text-[11.5px] text-[color:var(--ink-soft)]">
                    {statusLabel}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[color:var(--rule)]/60">
                  <div
                    className="h-full rounded-full bg-pay"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-baseline justify-between text-[12px]">
                  <span className="font-mono font-semibold tabular-nums">
                    {formatWon(c.currentAmount)}{" "}
                    <span className="text-[color:var(--ink-soft)]">
                      / {formatWon(c.goalAmount)}
                    </span>
                  </span>
                  <span className="text-[color:var(--ink-soft)]">
                    {pct}% · {c.backerCount}명
                  </span>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
