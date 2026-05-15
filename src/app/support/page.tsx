import { PublicShell } from "@/features/landing/PublicShell";

export const metadata = {
  title: "Payflow — 고객센터",
};

const FAQ = [
  {
    q: "비밀번호를 잊어버렸어요.",
    a: "현재 데모 단계에서는 비밀번호 재설정이 제공되지 않습니다. 정식 출시 시 이메일 인증 기반 재설정이 합류합니다.",
  },
  {
    q: "송금 기능은 언제 열리나요?",
    a: "Stage 2에서 지갑/송금 모듈이 합류합니다. 현재는 영수증 피드와 좋아요/북마크/댓글 인터랙션만 제공됩니다.",
  },
  {
    q: "내 영수증을 다른 사람이 볼 수 있나요?",
    a: "기본 공개 범위는 팔로워입니다. 비공개 게시물 옵션은 작성 화면에서 선택할 수 있도록 준비 중입니다.",
  },
  {
    q: "탈퇴는 어떻게 하나요?",
    a: "현재는 데모 데이터 정리를 위해 운영팀에 문의해 주시면 즉시 탈퇴 처리됩니다.",
  },
];

export default function SupportPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            Customer Support
          </p>
          <h1 className="font-display text-4xl italic leading-tight">
            궁금한 점, 바로 풀어드릴게요.
          </h1>
          <p className="text-[14px] text-[color:var(--ink-soft)]">
            자주 묻는 질문을 먼저 확인해 보세요. 그래도 해결이 안 된다면 아래
            창구로 연락 주세요.
          </p>
        </header>

        <section className="flex flex-col gap-3">
          {FAQ.map((item) => (
            <details
              key={item.q}
              className="group rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-5 py-4 transition-colors open:border-[color:var(--pay)]/40"
            >
              <summary className="flex cursor-pointer items-center justify-between text-[13.5px] font-semibold marker:hidden">
                {item.q}
                <span className="text-[color:var(--ink-soft)] transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <p className="mt-3 text-[13px] leading-relaxed text-[color:var(--foreground)]/80">
                {item.a}
              </p>
            </details>
          ))}
        </section>

        <section className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-7">
          <p className="text-[13px] font-semibold">직접 문의하기</p>
          <p className="mt-1 text-[13px] text-[color:var(--ink-soft)]">
            평일 10:00 – 18:00 (KST). 결제·송금 관련은 영업일 기준 1일 이내
            회신.
          </p>
          <dl className="mt-4 grid gap-2 text-[13px] sm:grid-cols-2">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                Email
              </dt>
              <dd className="font-mono text-[color:var(--foreground)]">
                support@payflow.app
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.14em] text-[color:var(--ink-soft)]">
                Press
              </dt>
              <dd className="font-mono text-[color:var(--foreground)]">
                press@payflow.app
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </PublicShell>
  );
}
