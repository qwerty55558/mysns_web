"use client";

import Image from "next/image";
import { useRef, useState } from "react";

type Props = {
  imageUrls: ReadonlyArray<string>;
  tag?: string | null;
};

export function PostCarousel({ imageUrls, tag }: Props) {
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
              src={url}
              alt=""
              fill
              sizes="(max-width: 768px) 100vw, 600px"
              className="object-cover"
              priority={i === 0}
            />
          </div>
        ))}
      </div>

      {tag && (
        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center rounded-full bg-white/95 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pay-forest)] ring-1 ring-[color:var(--pay)]/25 backdrop-blur-sm">
          {tag}
        </span>
      )}

      {total > 1 && (
        <>
          <span className="pointer-events-none absolute right-3 top-3 rounded-full bg-black/65 px-2 py-0.5 font-mono text-[10.5px] tabular-nums text-white">
            {index + 1} / {total}
          </span>

          {index > 0 && (
            <button
              type="button"
              aria-label="이전 이미지"
              onClick={() => goTo(index - 1)}
              className="absolute left-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-1.5 text-[color:var(--foreground)] opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100 sm:flex"
            >
              <ChevronLeft />
            </button>
          )}
          {index < total - 1 && (
            <button
              type="button"
              aria-label="다음 이미지"
              onClick={() => goTo(index + 1)}
              className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-full bg-white/85 p-1.5 text-[color:var(--foreground)] opacity-0 shadow-md backdrop-blur transition-opacity group-hover:opacity-100 sm:flex"
            >
              <ChevronRight />
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRight() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}
