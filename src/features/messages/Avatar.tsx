import Image from "next/image";
import { toAbsoluteMediaUrl } from "@/lib/upload";

type Props = {
  avatarUrl?: string | null;
  displayName: string;
  size?: number;
};

/** DM 화면 공용 아바타 — gradient ring + 이니셜 폴백. avatarUrl은 절대경로 변환. */
export function Avatar({ avatarUrl, displayName, size = 40 }: Props) {
  return (
    <span
      className="bg-pay-gradient inline-flex shrink-0 items-center justify-center rounded-full p-[2px]"
      style={{ height: size, width: size }}
    >
      <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12.5px] font-semibold">
        {avatarUrl ? (
          <Image
            src={toAbsoluteMediaUrl(avatarUrl)}
            alt=""
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </span>
    </span>
  );
}
