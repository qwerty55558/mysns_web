import type {
  SplitBillStatus,
  SplitParticipantStatus,
} from "@/gql/graphql";

export { formatWon } from "@/features/wallet/format";

export function billStatusLabel(status: SplitBillStatus): string {
  switch (status) {
    case "OPEN":
      return "진행 중";
    case "SETTLED":
      return "정산 완료";
    case "CANCELLED":
      return "취소됨";
    default:
      return status;
  }
}

export function participantStatusLabel(status: SplitParticipantStatus): string {
  switch (status) {
    case "PENDING":
      return "대기 중";
    case "ACCEPTED":
      return "수락";
    case "DECLINED":
      return "거절";
    default:
      return status;
  }
}

/** 상태별 색 토큰. chip/배지 공용. */
export function statusTone(
  status: SplitBillStatus | SplitParticipantStatus,
): { fg: string; bg: string } {
  switch (status) {
    case "SETTLED":
    case "ACCEPTED":
      return { fg: "var(--pay-forest)", bg: "rgba(3,199,90,0.12)" };
    case "CANCELLED":
    case "DECLINED":
      return { fg: "var(--danger)", bg: "rgba(214,70,63,0.1)" };
    default: // OPEN / PENDING
      return { fg: "var(--ink-soft)", bg: "var(--rule)" };
  }
}

export function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const sec = Math.floor((Date.now() - t) / 1000);
  if (sec < 60) return "방금 전";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}일 전`;
  const d = new Date(t);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}
