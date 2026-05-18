"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { toAbsoluteMediaUrl } from "@/lib/upload";

type Props = {
  imageUrls: ReadonlyArray<string>;
  item?: string | null;
  amount?: number | null;
};

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export function PostCarousel({ imageUrls, item, amount }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const total = imageUrls.length;

  if (total === 0) return null;

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(total - 1, i));
    const track = trackRef.current;
    if (!track) return;
    const target = track.children[clamped] as HTMLElement | undefined;
    target?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "start" });
  };

  const onScroll = () => {
    const track = trackRef.current;
    if (!track) return;
    const i = Math.round(track.scrollLeft / track.clientWidth);
    if (i !== index) setIndex(i);
  };

  const canPrev = index > 0;
  const canNext = index < total - 1;

  return (
    <div className="group relative aspect-square w-full overflow-hidden">
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto scroll-smooth no-scrollbar"
      >
        {imageUrls.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="relative h-full w-full shrink-0 snap-center"
          >
            <Image
              src={toAbsoluteMediaUrl(url)}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {(item || amount != null) && (
        <div className="pointer-events-none absolute left-3 top-3 flex max-w-[calc(100%-6rem)] items-center gap-1.5">
          {item && (
            <span className="inline-flex items-center truncate rounded-full bg-white/95 px-3 py-1 text-[12px] font-medium text-[color:var(--pay-forest)] ring-1 ring-[color:var(--pay)]/25 backdrop-blur-sm">
              {item}
            </span>
          )}
          {amount != null && (
            <span className="inline-flex items-center rounded-full bg-[color:var(--pay)] px-3 py-1 font-mono text-[11px] font-semibold tabular-nums text-[color:var(--pay-on)] shadow-[0_6px_18px_-8px_rgba(3,199,90,0.55)]">
              {krwFormatter.format(amount)}
            </span>
          )}
        </div>
      )}

      {total > 1 && (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-white">
            {index + 1} / {total}
          </span>

          {canPrev && (
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => goTo(index - 1)}
              className="group/zone absolute left-0 top-0 z-10 flex h-full w-1/3 cursor-w-resize items-center justify-start pl-3 focus:outline-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[color:var(--foreground)] opacity-0 shadow-md backdrop-blur transition-opacity duration-150 group-hover/zone:opacity-100 group-focus-visible/zone:opacity-100">
                <ChevronLeft />
              </span>
            </button>
          )}
          {canNext && (
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => goTo(index + 1)}
              className="group/zone absolute right-0 top-0 z-10 flex h-full w-1/3 cursor-e-resize items-center justify-end pr-3 focus:outline-none"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-[color:var(--foreground)] opacity-0 shadow-md backdrop-blur transition-opacity duration-150 group-hover/zone:opacity-100 group-focus-visible/zone:opacity-100">
                <ChevronRight />
              </span>
            </button>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5">
            {imageUrls.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === index ? "w-4 bg-white" : "w-1.5 bg-white/55"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
