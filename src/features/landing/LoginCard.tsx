import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";

export function LoginCard() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-8 py-10 shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_40px_-30px_rgba(20,12,30,0.25)]">
        <div className="flex flex-col items-center gap-2">
          <span className="font-display text-5xl italic tracking-tight text-pay-gradient">
            Payflow
          </span>
          <p className="text-center text-[13px] text-[color:var(--ink-soft)]">
            기록하고, 공유하고, 바로 송금까지.
          </p>
        </div>
        <div className="mt-8">
          <LoginForm />
        </div>
        <div className="mt-6 flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
          <span className="h-px flex-1 bg-[color:var(--rule)]" />
          or
          <span className="h-px flex-1 bg-[color:var(--rule)]" />
        </div>
        <p className="mt-4 text-center text-[12px] text-[color:var(--ink-soft)]">
          Stage 1 데모 계정 ·{" "}
          <span className="font-mono text-[color:var(--foreground)]/80">
            alice / password
          </span>
        </p>
      </div>

      <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-5 text-center text-[13px] text-[color:var(--foreground)]/80">
        계정이 없으신가요?{" "}
        <Link
          href="#"
          aria-disabled
          className="font-semibold text-pay-gradient"
          tabIndex={-1}
        >
          가입하기
        </Link>
        <p className="mt-1 text-[11px] text-[color:var(--ink-soft)]">
          가입 플로우는 다음 단계에서 제공됩니다.
        </p>
      </div>
    </div>
  );
}
