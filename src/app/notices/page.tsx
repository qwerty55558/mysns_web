import { PublicShell } from "@/features/landing/PublicShell";

export const metadata = {
  title: "Payflow — 공지사항",
};

type Notice = {
  date: string;
  tag: "공지" | "점검" | "업데이트" | "약관";
  title: string;
  body: string;
};

const NOTICES: Notice[] = [
  {
    date: "2026-05-12",
    tag: "업데이트",
    title: "피드 게시물에 금액·카테고리 chip이 추가되었습니다",
    body: "이제 영수증 게시물에 금액과 카테고리(식사·카페·교통 등)가 표시됩니다. 자세한 변경 내역은 서비스 소개 페이지를 참고해 주세요.",
  },
  {
    date: "2026-05-08",
    tag: "공지",
    title: "Stage 1 클로즈드 데모 시작",
    body: "초대받은 사용자에 한해 피드·로그인·가입 흐름을 우선 공개합니다. 정식 출시 일정은 별도 공지 예정입니다.",
  },
  {
    date: "2026-05-02",
    tag: "약관",
    title: "전자금융거래 이용약관 사전 안내",
    body: "송금/지갑 기능 합류에 앞서 전자금융거래 이용약관 초안을 사전 공유드립니다. 정식 동의 절차는 Stage 2 출시 시 별도로 진행됩니다.",
  },
  {
    date: "2026-04-25",
    tag: "점검",
    title: "정기 시스템 점검 안내 (5/3 02:00 – 04:00 KST)",
    body: "데이터베이스 마이그레이션을 위해 약 2시간 점검이 진행됩니다. 점검 시간 동안에는 로그인을 포함한 모든 기능이 일시 중단됩니다.",
  },
];

const TAG_STYLE: Record<Notice["tag"], string> = {
  공지: "bg-[color:var(--ink-soft)]/15 text-[color:var(--foreground)]",
  점검: "bg-[color:var(--danger)]/12 text-[color:var(--danger)]",
  업데이트: "bg-[color:var(--pay)]/12 text-[color:var(--pay-forest)]",
  약관: "bg-[color:var(--rule)] text-[color:var(--foreground)]/80",
};

export default function NoticesPage() {
  return (
    <PublicShell>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-[12px] uppercase tracking-[0.2em] text-[color:var(--ink-soft)]">
            Notices
          </p>
          <h1 className="font-display text-4xl italic leading-tight">공지사항</h1>
          <p className="text-[14px] text-[color:var(--ink-soft)]">
            서비스 운영 관련 소식과 점검 일정, 정책 변경을 안내합니다.
          </p>
        </header>

        <ul className="flex flex-col gap-3">
          {NOTICES.map((n) => (
            <li
              key={n.date + n.title}
              className="rounded-2xl border border-[color:var(--rule)] bg-[color:var(--paper)] px-5 py-5"
            >
              <div className="flex items-center gap-2 text-[11px]">
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold uppercase tracking-[0.12em] ${TAG_STYLE[n.tag]}`}
                >
                  {n.tag}
                </span>
                <time className="font-mono text-[color:var(--ink-soft)]">
                  {n.date}
                </time>
              </div>
              <p className="mt-2 text-[14px] font-semibold">{n.title}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[color:var(--foreground)]/80">
                {n.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </PublicShell>
  );
}
