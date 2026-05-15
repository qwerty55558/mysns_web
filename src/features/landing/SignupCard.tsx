import Link from "next/link";
import { SignupForm } from "@/features/auth/SignupForm";

export function SignupCard() {
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
            한 컷의 영수증, 한 번의 송금으로 시작.
          </p>
        </div>
        <div className="mt-8">
          <SignupForm />
        </div>
      </div>

      <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-5 text-center text-[13px] text-[color:var(--foreground)]/80">
        이미 계정이 있으신가요?{" "}
        <Link href="/login" className="font-semibold text-pay-gradient">
          로그인
        </Link>
      </div>
    </div>
  );
}
