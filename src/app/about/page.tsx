import { PublicShell } from "@/features/landing/PublicShell";

export const metadata = {
  title: "Payflow — 서비스 소개",
};

export default function AboutPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-10">
        <header className="flex flex-col gap-3">
          <p className="text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            About Payflow
          </p>
          <h1 className="font-display text-4xl italic leading-tight">
            <span className="text-pay-gradient">소비의 흐름</span>을, 친구와.
          </h1>
          <p className="text-[14px] text-[color:var(--ink-soft)]">
            영수증 한 컷이 게시물이 되고, 그 자리에서 바로 송금이 일어나는
            소비-중심 SNS.
          </p>
        </header>

        <section className="grid gap-5 sm:grid-cols-2">
          <Card
            title="Pay × SNS"
            body="게시물의 단위는 사진이 아니라 영수증. 누가 어디에 얼마를 썼는지가 그대로 피드가 됩니다."
          />
          <Card
            title="바로 송금"
            body="더치페이도 답방도, 댓글에서 한 번의 탭으로. 별도 송금 앱을 켤 필요가 없습니다."
          />
          <Card
            title="지갑·내역"
            body="모든 흐름은 한 곳의 지갑으로 모입니다. 카테고리별 흐름을 한눈에 정리합니다."
          />
          <Card
            title="신뢰감 있는 톤"
            body="인스타 같은 친근함과 핀테크의 정확함을 함께. 디자인부터 약관 안내까지 차분하게."
          />
        </section>

        <section className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-7 text-[13px] text-[color:var(--foreground)]/80">
          <p className="font-semibold text-[color:var(--foreground)]">
            현재 단계
          </p>
          <p className="mt-1 text-[color:var(--ink-soft)]">
            Stage 1 — 피드·로그인·가입까지 정리된 데모입니다. 송금/지갑 기능은
            다음 단계에서 합류합니다.
          </p>
        </section>
      </div>
    </PublicShell>
  );
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-5 py-5">
      <p className="text-[13px] font-semibold">{title}</p>
      <p className="mt-1.5 text-[13px] text-[color:var(--ink-soft)]">{body}</p>
    </div>
  );
}
