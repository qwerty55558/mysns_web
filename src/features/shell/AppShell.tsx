import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { PageSlide } from "./PageSlide";

/**
 * 인증 페이지 공용 셸 — 고정 헤더(로고 + 알림 + 햄버거) + 슬라이드 전환 본문 +
 * 하단 탭바(피드/메시지/프로필). 상세/스레드처럼 탭바가 방해되는 화면은 showNav={false}.
 */
export function AppShell({
  children,
  showNav = true,
  mainClassName = "mx-auto flex w-full max-w-2xl flex-1 flex-col gap-5 px-5 py-6",
}: {
  children: React.ReactNode;
  showNav?: boolean;
  mainClassName?: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center bg-[color:var(--background)] text-[color:var(--foreground)]">
      <AppHeader />
      <PageSlide>
        <main className={`${mainClassName}${showNav ? " pb-24" : ""}`}>
          {children}
        </main>
      </PageSlide>
      {showNav && <BottomNav />}
    </div>
  );
}
