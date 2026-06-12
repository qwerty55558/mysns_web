"use client";

import { usePathname } from "next/navigation";

/**
 * 경로가 바뀔 때마다 key가 바뀌어 슬라이드-인 애니메이션이 재생된다.
 * 헤더/하단 탭바는 고정이고 본문만 전환되어 탭 전환이 슬라이딩처럼 보인다.
 */
export function PageSlide({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname}
      className="page-slide flex w-full flex-1 flex-col items-center"
    >
      {children}
    </div>
  );
}
