"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "@apollo/client/react";
import { CombinedGraphQLErrors } from "@apollo/client/errors";
import type { ThemePreset, SubscriptionPlan } from "@/gql/graphql";
import { SheetShell } from "@/features/wallet/SheetShell";
import { formatWon } from "@/features/wallet/format";
import { THEME_PRESETS, THEME_BY_KEY } from "./themes";
import { EmphasizedName } from "@/features/profile/EmphasizedName";
import {
  FONT_OPTIONS,
  EMPHASIS_OPTIONS,
  NAME_FONT_LABELS,
  NAME_EMPHASIS_LABELS,
  NAME_FONT_VARS,
} from "@/features/profile/nameEmphasis";
import {
  MySubscriptionQuery,
  SubscribeMutation,
  ChangeSubscriptionThemeMutation,
  CancelSubscriptionMutation,
  ChangeNameEmphasisMutation,
  ChangeNameFontMutation,
} from "./queries";

const PLAN_PRICE: Record<SubscriptionPlan, number> = {
  MONTHLY: 3800,
  YEARLY: 38000,
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function SubscriptionView() {
  const res = useQuery(MySubscriptionQuery, { fetchPolicy: "cache-and-network" });
  const { data: sessionData } = useSession();

  const sub = res.data?.mySubscription;
  const balance = res.data?.myWallet?.balance ?? 0;
  const isActive = !!(sub && sub.status === "ACTIVE");

  const [selectedTheme, setSelectedTheme] = useState<ThemePreset>("OCEAN");
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>("YEARLY");
  const [sheetOpen, setSheetOpen] = useState(false);

  const [changeTheme, changeThemeState] = useMutation(ChangeSubscriptionThemeMutation);
  const [cancelSubscription, cancelState] = useMutation(CancelSubscriptionMutation);
  const [changeNameEmphasis, changeEmphasisState] = useMutation(ChangeNameEmphasisMutation);
  const [changeNameFont, changeFontState] = useMutation(ChangeNameFontMutation);

  const heroThemeKey: ThemePreset = isActive
    ? (sub!.theme as ThemePreset)
    : selectedTheme;
  const heroStyle = THEME_BY_KEY[heroThemeKey];

  const onCancelSubscription = async () => {
    if (
      !window.confirm(
        "구독을 해지할까요? 다음 결제일까지는 프리미엄이 유지돼요.",
      )
    )
      return;
    try {
      await cancelSubscription({ refetchQueries: ["MySubscription"] });
    } catch {
      // error is shown via cancelState
    }
  };

  const onChangeTheme = async (theme: ThemePreset) => {
    try {
      await changeTheme({
        variables: { theme },
        refetchQueries: ["MySubscription"],
      });
    } catch {
      // silent — grid shows pending
    }
  };

  const onChangeEmphasis = async (emphasis: import("@/gql/graphql").NameEmphasis) => {
    try {
      await changeNameEmphasis({
        variables: { emphasis },
        refetchQueries: ["MySubscription"],
      });
    } catch {
      // silent
    }
  };

  const onChangeFont = async (font: import("@/gql/graphql").NameFont) => {
    try {
      await changeNameFont({
        variables: { font },
        refetchQueries: ["MySubscription"],
      });
    } catch {
      // silent
    }
  };

  const previewName =
    sessionData?.user?.name ?? (sessionData?.user as { username?: string } | undefined)?.username ?? "Payflow";

  if (res.loading && !res.data) {
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">불러오는 중…</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Hero card */}
      <section
        className="relative overflow-hidden rounded-3xl p-5 text-white shadow-[0_18px_40px_-22px_rgba(0,0,0,0.4)]"
        style={{ background: heroStyle.gradient }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[18px]">✦</span>
          <p className="text-[11px] uppercase tracking-[0.2em] opacity-80">
            Payflow 프리미엄
          </p>
        </div>
        <p className="mt-1 text-[22px] font-bold">
          {heroStyle.label} · {heroStyle.blurb}
        </p>
        {isActive && (
          <p className="mt-1 text-[13px] font-medium opacity-90">
            구독 중 ·{" "}
            {sub!.plan === "MONTHLY" ? "월간" : "연간"}
          </p>
        )}
        {!isActive && (
          <p className="mt-1 text-[13px] opacity-80">
            프리미엄 혜택을 시작해보세요
          </p>
        )}
      </section>

      {isActive ? (
        <ActiveSubscriberView
          sub={sub!}
          previewName={previewName}
          onChangeTheme={onChangeTheme}
          changeThemePending={changeThemeState.loading}
          onChangeEmphasis={onChangeEmphasis}
          changeEmphasisPending={changeEmphasisState.loading}
          onChangeFont={onChangeFont}
          changeFontPending={changeFontState.loading}
          onCancel={onCancelSubscription}
          cancelPending={cancelState.loading}
        />
      ) : (
        <UpsellView
          balance={balance}
          selectedTheme={selectedTheme}
          onSelectTheme={setSelectedTheme}
          selectedPlan={selectedPlan}
          onSelectPlan={setSelectedPlan}
          onOpenSheet={() => setSheetOpen(true)}
          previewName={previewName}
        />
      )}

      {sheetOpen && (
        <SubscribeSheet
          plan={selectedPlan}
          theme={selectedTheme}
          balance={balance}
          onClose={() => setSheetOpen(false)}
        />
      )}
    </div>
  );
}

function ActiveSubscriberView({
  sub,
  previewName,
  onChangeTheme,
  changeThemePending,
  onChangeEmphasis,
  changeEmphasisPending,
  onChangeFont,
  changeFontPending,
  onCancel,
  cancelPending,
}: {
  sub: {
    id: string;
    status: string;
    plan: string;
    theme: string;
    price: number;
    autoRenew: boolean;
    startedAt: string;
    currentPeriodEnd: string;
    nameEmphasis?: import("@/gql/graphql").NameEmphasis | null;
    nameFont?: import("@/gql/graphql").NameFont | null;
  };
  previewName: string;
  onChangeTheme: (theme: ThemePreset) => Promise<void>;
  changeThemePending: boolean;
  onChangeEmphasis: (emphasis: import("@/gql/graphql").NameEmphasis) => Promise<void>;
  changeEmphasisPending: boolean;
  onChangeFont: (font: import("@/gql/graphql").NameFont) => Promise<void>;
  changeFontPending: boolean;
  onCancel: () => Promise<void>;
  cancelPending: boolean;
}) {
  const planLabel = sub.plan === "MONTHLY" ? "월간" : "연간";
  const periodLabel = sub.plan === "MONTHLY" ? "/월" : "/년";
  const endDate = formatDate(sub.currentPeriodEnd);
  const stylePending = changeEmphasisPending || changeFontPending;

  return (
    <>
      {/* Status section */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          구독 정보
        </h2>
        <ul className="divide-y divide-[color:var(--rule)] overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
          <StatusRow label="요금제" value={planLabel} />
          <StatusRow
            label="결제 금액"
            value={`${formatWon(sub.price)}${periodLabel}`}
          />
          <StatusRow label="다음 결제일" value={endDate} />
          <StatusRow
            label="자동 갱신"
            value={sub.autoRenew ? "켜짐" : "꺼짐 · 만료 후 종료"}
          />
        </ul>
        {!sub.autoRenew && (
          <p className="text-[12px] text-[color:var(--ink-soft)]">
            {endDate}에 구독이 종료돼요.
          </p>
        )}
      </section>

      {/* Theme picker */}
      <section className="flex flex-col gap-2">
        <div>
          <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            강조 테마
          </h2>
          <p className="mt-0.5 text-[12px] text-[color:var(--ink-soft)]">
            선택하면 바로 적용돼요
          </p>
        </div>
        <ThemeGrid
          value={sub.theme as ThemePreset}
          onSelect={onChangeTheme}
          pending={changeThemePending}
        />
      </section>

      {/* Name style studio */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          이름 스타일
        </h2>

        {/* Live preview */}
        <div className="flex items-center justify-center rounded-2xl bg-[color:var(--paper)] py-5 ring-1 ring-black/5">
          <EmphasizedName
            name={previewName}
            font={sub.nameFont}
            emphasis={sub.nameEmphasis}
            theme={sub.theme as ThemePreset}
            className="text-[26px]"
          />
        </div>

        {/* Font picker */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11.5px] font-medium text-[color:var(--ink-soft)]">폰트</p>
          <div className="grid grid-cols-3 gap-2">
            {FONT_OPTIONS.map((f) => {
              const isSelected = f === (sub.nameFont ?? "DEFAULT");
              return (
                <button
                  key={f}
                  type="button"
                  disabled={stylePending}
                  onClick={() => void onChangeFont(f)}
                  style={{ fontFamily: NAME_FONT_VARS[f] ?? undefined }}
                  className={`rounded-xl border px-2 py-2.5 text-[12px] leading-tight transition-colors disabled:opacity-60 ${
                    isSelected
                      ? "border-[color:var(--foreground)] bg-[color:var(--paper)] ring-2 ring-[color:var(--foreground)]/20"
                      : "border-[color:var(--rule)] bg-[color:var(--paper)] hover:border-[color:var(--foreground)]/30"
                  }`}
                >
                  {NAME_FONT_LABELS[f]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Emphasis picker */}
        <div className="flex flex-col gap-1.5">
          <p className="text-[11.5px] font-medium text-[color:var(--ink-soft)]">효과</p>
          <div className="grid grid-cols-3 gap-2">
            {EMPHASIS_OPTIONS.map((e) => {
              const isSelected = e === (sub.nameEmphasis ?? "NONE");
              return (
                <button
                  key={e}
                  type="button"
                  disabled={stylePending}
                  onClick={() => void onChangeEmphasis(e)}
                  className={`rounded-xl border px-2 py-2.5 text-[12px] leading-tight transition-colors disabled:opacity-60 ${
                    isSelected
                      ? "border-[color:var(--foreground)] bg-[color:var(--paper)] ring-2 ring-[color:var(--foreground)]/20"
                      : "border-[color:var(--rule)] bg-[color:var(--paper)] hover:border-[color:var(--foreground)]/30"
                  }`}
                >
                  {NAME_EMPHASIS_LABELS[e]}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Cancel */}
      <button
        type="button"
        onClick={onCancel}
        disabled={cancelPending}
        className="w-full rounded-full border border-[color:var(--danger)]/40 py-3 text-[14px] font-semibold text-[color:var(--danger)] transition-colors hover:bg-[color:var(--danger)]/5 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {cancelPending ? "처리 중…" : "구독 해지"}
      </button>
    </>
  );
}

function StatusRow({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <span className="text-[13.5px] text-[color:var(--ink-soft)]">{label}</span>
      <span className="text-[13.5px] font-medium tabular-nums">{value}</span>
    </li>
  );
}

function UpsellView({
  balance,
  selectedTheme,
  onSelectTheme,
  selectedPlan,
  onSelectPlan,
  onOpenSheet,
  previewName,
}: {
  balance: number;
  selectedTheme: ThemePreset;
  onSelectTheme: (t: ThemePreset) => void;
  selectedPlan: SubscriptionPlan;
  onSelectPlan: (p: SubscriptionPlan) => void;
  onOpenSheet: () => void;
  previewName: string;
}) {
  const selectedStyle = THEME_BY_KEY[selectedTheme];
  const price = PLAN_PRICE[selectedPlan];

  return (
    <>
      {/* Benefits preview */}
      <section className="flex flex-col gap-3">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          프리미엄 혜택
        </h2>

        {/* Benefit 1: 강조효과 */}
        <div className="overflow-hidden rounded-2xl bg-[color:var(--paper)] p-4 ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ink-soft)]">
            프로필 강조 테마
          </p>
          <div className="mt-3 flex items-center gap-3">
            {/* Themed avatar ring */}
            <span
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-[2px]"
              style={{ background: selectedStyle.gradient }}
            >
              <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12px] font-semibold">
                P
              </span>
            </span>
            <div className="flex flex-col leading-tight">
              <span className="text-[13px] font-semibold">payflow_user</span>
              <span className="text-[11px] text-[color:var(--ink-soft)]">
                Payflow 사용자
              </span>
            </div>
          </div>
          <p className="mt-3 text-[12px] text-[color:var(--ink-soft)]">
            내 프로필과 게시물 아바타가 선택한 테마로 빛나요
          </p>
        </div>

        {/* Benefit 2: 게시글 효과 */}
        <div className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
          <p className="px-4 pt-4 text-[12px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ink-soft)]">
            게시글 테마 효과
          </p>
          {/* Mini post preview */}
          <div className="mt-3">
            {/* Accent bar */}
            <div
              className="h-1.5 w-full"
              style={{ background: selectedStyle.gradient }}
            />
            <div className="flex items-center gap-2.5 px-4 py-3">
              <span
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full p-[2px]"
                style={{ background: selectedStyle.gradient }}
              >
                <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[11px] font-semibold">
                  P
                </span>
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-semibold">payflow_user</p>
                <p className="text-[12px] text-[color:var(--ink-soft)]">
                  오늘 커피 한 잔 ☕
                </p>
              </div>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums"
                style={{ background: selectedStyle.accent, color: selectedStyle.on }}
              >
                ₩4,500
              </span>
            </div>
          </div>
          <p className="px-4 pb-4 text-[12px] text-[color:var(--ink-soft)]">
            구독자만 게시물에 테마를 입힐 수 있어요
          </p>
        </div>

        {/* Benefit 3: 이름 강조 */}
        <div className="overflow-hidden rounded-2xl bg-[color:var(--paper)] p-4 ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
          <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[color:var(--ink-soft)]">
            이름 강조
          </p>
          <ul className="mt-3 flex flex-col gap-2">
            <li>
              <EmphasizedName
                name={previewName}
                font="UNBOUNDED"
                emphasis="GRADIENT"
                theme={selectedTheme}
                className="text-[18px]"
              />
            </li>
            <li>
              <EmphasizedName
                name={previewName}
                font="BLACK_HAN_SANS"
                emphasis="NEON"
                theme={selectedTheme}
                className="text-[18px]"
              />
            </li>
            <li>
              <EmphasizedName
                name={previewName}
                font="SYNE"
                emphasis="SPARKLE"
                theme={selectedTheme}
                className="text-[18px]"
              />
            </li>
          </ul>
          <p className="mt-3 text-[12px] text-[color:var(--ink-soft)]">
            내 이름에 글로우·그라데이션·네온 효과를 입혀보세요
          </p>
        </div>
      </section>

      {/* Theme picker */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          테마 선택
        </h2>
        <ThemeGrid value={selectedTheme} onSelect={onSelectTheme} />
      </section>

      {/* Plan selector */}
      <section className="flex flex-col gap-2">
        <h2 className="text-[11px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
          요금제
        </h2>
        <div className="flex flex-col gap-2">
          <PlanCard
            plan="MONTHLY"
            label="월간"
            price={PLAN_PRICE.MONTHLY}
            unit="월"
            selected={selectedPlan === "MONTHLY"}
            onSelect={() => onSelectPlan("MONTHLY")}
          />
          <PlanCard
            plan="YEARLY"
            label="연간"
            price={PLAN_PRICE.YEARLY}
            unit="년"
            badge="2개월 무료"
            selected={selectedPlan === "YEARLY"}
            onSelect={() => onSelectPlan("YEARLY")}
          />
        </div>
      </section>

      {/* Balance + CTA */}
      <div className="flex flex-col gap-3">
        <p className="text-center text-[12.5px] text-[color:var(--ink-soft)]">
          현재 잔액{" "}
          <span className="font-semibold tabular-nums text-[color:var(--foreground)]">
            {formatWon(balance)}
          </span>
        </p>
        <button
          type="button"
          onClick={onOpenSheet}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105"
        >
          {formatWon(price)} 결제하고 시작하기
        </button>
      </div>
    </>
  );
}

function PlanCard({
  label,
  price,
  unit,
  badge,
  selected,
  onSelect,
}: {
  plan: SubscriptionPlan;
  label: string;
  price: number;
  unit: string;
  badge?: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition-colors ${
        selected
          ? "border-[color:var(--pay)] ring-1 ring-[color:var(--pay)] bg-[color:var(--pay)]/5"
          : "border-[color:var(--rule)] bg-[color:var(--paper)] hover:border-[color:var(--pay)]/40"
      }`}
    >
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-semibold">{label}</span>
        {badge && (
          <span className="rounded-full bg-[color:var(--pay)] px-2 py-0.5 text-[10.5px] font-semibold text-[color:var(--pay-on)]">
            {badge}
          </span>
        )}
      </div>
      <span className="tabular-nums text-[14px] font-semibold">
        {formatWon(price)}{" "}
        <span className="text-[12px] font-normal text-[color:var(--ink-soft)]">
          / {unit}
        </span>
      </span>
    </button>
  );
}

function ThemeGrid({
  value,
  onSelect,
  pending,
}: {
  value: ThemePreset;
  onSelect: (t: ThemePreset) => Promise<void> | void;
  pending?: boolean;
}) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {THEME_PRESETS.map((style) => {
        const isSelected = style.key === value;
        return (
          <button
            key={style.key}
            type="button"
            disabled={pending}
            onClick={() => void onSelect(style.key)}
            className={`flex flex-col items-center gap-1.5 rounded-2xl border p-3 transition-colors disabled:opacity-60 ${
              isSelected
                ? "border-[color:var(--foreground)] bg-[color:var(--paper)] ring-2 ring-[color:var(--foreground)]/20"
                : "border-[color:var(--rule)] bg-[color:var(--paper)] hover:border-[color:var(--foreground)]/30"
            }`}
          >
            <span className="relative flex h-10 w-10 items-center justify-center rounded-full">
              <span
                className="h-full w-full rounded-full"
                style={{ background: style.gradient }}
              />
              {isSelected && (
                <span className="absolute inset-0 flex items-center justify-center text-white text-[14px] font-bold">
                  ✓
                </span>
              )}
            </span>
            <span className="text-[11.5px] font-medium">{style.label}</span>
          </button>
        );
      })}
    </div>
  );
}

function SubscribeSheet({
  plan,
  theme,
  balance,
  onClose,
}: {
  plan: SubscriptionPlan;
  theme: ThemePreset;
  balance: number;
  onClose: () => void;
}) {
  const [autoRenew, setAutoRenew] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [subscribe, subState] = useMutation(SubscribeMutation);

  const themeStyle = THEME_BY_KEY[theme];
  const price = PLAN_PRICE[plan];
  const planLabel = plan === "MONTHLY" ? "월간" : "연간";
  const insufficient = price > balance;
  const canSubmit = !insufficient && !subState.loading;

  const onConfirm = async () => {
    if (!canSubmit) return;
    setError(null);
    try {
      await subscribe({
        variables: { input: { plan, theme, autoRenew } },
        refetchQueries: ["MySubscription", "MyWallet"],
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
    <SheetShell title="프리미엄 구독" onClose={onClose}>
      <div className="flex flex-col gap-4">
        {/* Summary */}
        <div className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5">
          <ul className="divide-y divide-[color:var(--rule)]">
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-[color:var(--ink-soft)]">요금제</span>
              <span className="text-[13px] font-medium">{planLabel}</span>
            </li>
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-[color:var(--ink-soft)]">테마</span>
              <span className="flex items-center gap-1.5 text-[13px] font-medium">
                <span
                  className="inline-block h-3.5 w-3.5 rounded-full"
                  style={{ background: themeStyle.gradient }}
                />
                {themeStyle.label}
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-[color:var(--ink-soft)]">결제 금액</span>
              <span className="text-[13px] font-semibold tabular-nums">
                {formatWon(price)}
              </span>
            </li>
            <li className="flex items-center justify-between px-4 py-3">
              <span className="text-[13px] text-[color:var(--ink-soft)]">현재 잔액</span>
              <span className="text-[13px] tabular-nums">{formatWon(balance)}</span>
            </li>
          </ul>
        </div>

        {/* Auto-renew toggle */}
        <label className="flex cursor-pointer items-center justify-between rounded-2xl bg-[color:var(--paper)] px-4 py-3 ring-1 ring-black/5">
          <span className="text-[13.5px]">자동 갱신</span>
          <input
            type="checkbox"
            checked={autoRenew}
            onChange={(e) => setAutoRenew(e.target.checked)}
            className="h-4 w-4 cursor-pointer accent-[color:var(--pay)]"
          />
        </label>

        {insufficient && (
          <p className="text-[12px] text-[color:var(--danger)]">
            잔액이 부족해요. 지갑을 먼저 충전해주세요.
          </p>
        )}
        {error && (
          <p role="alert" className="text-[12px] text-[color:var(--danger)]">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={onConfirm}
          disabled={!canSubmit}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {subState.loading ? "처리 중…" : `${formatWon(price)} 결제하기`}
        </button>
      </div>
    </SheetShell>
  );
}
