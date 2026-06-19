import Link from "next/link";
import { LoginForm } from "@/features/auth/LoginForm";

export function LoginCard() {
  return (
    <div className="flex w-full max-w-sm flex-col gap-4">
      <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-8 py-10 shadow-[0_1px_0_rgba(0,0,0,0.02),0_20px_40px_-30px_rgba(20,12,30,0.25)]">
        <div className="flex flex-col items-center gap-2">
          <Link
            href="/"
            aria-label="Payflow 홈으로"
            className="font-display text-5xl italic tracking-tight text-pay-gradient transition-opacity hover:opacity-80"
          >
            Payflow
          </Link>
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
        <div className="mt-4 space-y-1 text-center text-[12px] text-[color:var(--ink-soft)]">
          <p>
            테스트 계정 ·{" "}
            <span className="font-mono text-[color:var(--foreground)]/80">
              alice / password
            </span>
          </p>
          <p>
            어드민 ·{" "}
            <span className="font-mono text-[color:var(--foreground)]/80">
              admin / password
            </span>
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-5 text-center text-[13px] text-[color:var(--foreground)]/80">
        계정이 없으신가요?{" "}
        <Link href="/signup" className="font-semibold text-pay-gradient">
          가입하기
        </Link>
      </div>
    </div>
  );
}
