// 모달 슬롯이 활성화된 상태에서 /posts/[id] 외의 경로로 soft-nav 하면
// (예: 모달 안에서 작성자 프로필 클릭) 이 catch-all이 null을 렌더해 모달을 닫는다.
export default function CatchAll() {
  return null;
}
