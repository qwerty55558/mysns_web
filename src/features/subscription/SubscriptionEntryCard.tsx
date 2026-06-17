"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { SubscriptionStatusQuery } from "./queries";
import { THEME_BY_KEY } from "./themes";
import type { ThemePreset } from "@/gql/graphql";

function planLabel(plan: string): string {
  if (plan === "MONTHLY") return "월간";
  if (plan === "YEARLY") return "연간";
  return plan;
}

export function SubscriptionEntryCard() {
  const { data } = useQuery(SubscriptionStatusQuery, {
    fetchPolicy: "cache-and-network",
  });

  const sub = data?.mySubscription;
  const isActive = !!(sub && sub.status === "ACTIVE");
  const themeStyle = isActive ? THEME_BY_KEY[sub!.theme as ThemePreset] : null;

  return (
    <div className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
      <Link
        href="/subscription"
        className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[color:var(--rule)]/30"
      >
        <span
          className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white text-[16px]"
          style={{
            background:
              isActive && themeStyle
                ? themeStyle.gradient
                : "var(--gradient-pay)",
          }}
        >
          ✦
        </span>

        <div className="min-w-0 flex-1 flex flex-col leading-tight">
          {isActive ? (
            <>
              <p className="text-[13.5px] font-semibold">프리미엄 구독 중</p>
              <p className="text-[12px] text-[color:var(--ink-soft)]">
                {planLabel(sub!.plan)} · {themeStyle?.label} 테마
              </p>
            </>
          ) : (
            <>
              <p className="text-[13.5px] font-semibold">Payflow 프리미엄</p>
              <p className="text-[12px] text-[color:var(--ink-soft)]">
                테마 강조효과 · 게시글 효과 잠금 해제
              </p>
            </>
          )}
        </div>

        <span className="text-[color:var(--ink-soft)] text-[18px]">›</span>
      </Link>
    </div>
  );
}
