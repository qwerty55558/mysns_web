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
            body="더치페이, 경조사비, 용돈 모두 댓글에서 한 번의 탭으로. 별도 송금 앱을 켤 필요가 없습니다."
          />
          <Card
            title="지갑·내역"
            body="모든 소비는 페이플로우로 모입니다. 항목별 소비를 한눈에 정리합니다."
          />
          <Card
            title="나만의 피드"
            body="기능은 같게, 느낌은 다르게. 구독을 통해 내 취향으로 피드를 꾸며보세요."
          />
        </section>

        <section className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-6 py-7">
          <p className="text-[13px] font-semibold text-[color:var(--foreground)]">
            현재 단계
          </p>
          <ul className="mt-3 flex flex-col gap-3">
            <Stage
              done
              label="Stage 1 · 기반"
              body="로그인·가입·세션, 디자인 시스템."
            />
            <Stage
              done
              label="Stage 2 · SNS"
              body="영수증 게시물·피드, 좋아요·댓글·북마크, 팔로우·비공개 계정, 다이렉트 메시지, 알림, 계정·해시태그 검색."
            />
            <Stage
              done
              label="Stage 3 · 지갑·송금"
              body="모의 잔액 지갑, 충전·출금, 친구에게 바로 송금(P2P), 거래내역. 프로필·DM에서 한 번의 탭으로."
            />
          </ul>
        </section>
      </div>
    </PublicShell>
  );
}

function Stage({
  label,
  body,
  done,
}: {
  label: string;
  body: string;
  done?: boolean;
}) {
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
          done
            ? "bg-[color:var(--pay)] text-[color:var(--pay-on)]"
            : "border border-[color:var(--rule)] text-[color:var(--ink-soft)]"
        }`}
      >
        {done ? "✓" : "·"}
      </span>
      <div className="flex flex-col gap-0.5">
        <p className="text-[13px] font-semibold text-[color:var(--foreground)]">
          {label}
        </p>
        <p className="text-[12.5px] text-[color:var(--ink-soft)]">{body}</p>
      </div>
    </li>
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
