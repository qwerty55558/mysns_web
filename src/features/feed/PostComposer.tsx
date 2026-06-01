"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { uploadImage } from "@/lib/upload";
import { PlacePicker, type PlaceDraft } from "./PlacePicker";
import { searchPlaceByName } from "./kakao-place-search";

const CreatePostMutation = graphql(`
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      id
      content
      createdAt
      imageUrls
      tag
      item
      amount
      place {
        latitude
        longitude
        name
        address
        externalId
        categoryName
        categoryCode
      }
      likeCount
      commentCount
      shareCount
      viewerHasLiked
      viewerHasBookmarked
      author {
        id
        username
        displayName
        avatarUrl
      }
      previewComment {
        id
        content
        author {
          id
          username
        }
      }
    }
  }
`);

const AnalyzeReceiptQuery = graphql(`
  query AnalyzeReceipt($imageUrl: String!) {
    analyzeReceipt(imageUrl: $imageUrl) {
      amount
      item
      tag
      placeName
      rawText
      confidence
    }
  }
`);

type ImageDraft = {
  id: string;
  blobUrl: string;
  remoteUrl: string | null;
  status: "uploading" | "analyzing" | "done" | "failed";
  error?: string;
};

export function PostComposer() {
  const { data: session } = useSession();
  const client = useApolloClient();
  const [expanded, setExpanded] = useState(false);
  const [content, setContent] = useState("");
  const [tag, setTag] = useState("");
  const [item, setItem] = useState("");
  const [amount, setAmount] = useState("");
  const [place, setPlace] = useState<PlaceDraft | null>(null);
  const [images, setImages] = useState<ImageDraft[]>([]);
  const [error, setError] = useState<string | null>(null);
  // OCR 결과 안내 (저신뢰도 안내 + rawText 참고 표시)
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formId = useId();
  const amountRef = useRef(amount);
  amountRef.current = amount;
  const itemRef = useRef(item);
  itemRef.current = item;
  const tagRef = useRef(tag);
  tagRef.current = tag;
  const placeRef = useRef(place);
  placeRef.current = place;
  const imagesRef = useRef(images);
  imagesRef.current = images;

  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) URL.revokeObjectURL(img.blobUrl);
    };
  }, []);

  const [createPost, { loading: submitting }] = useMutation(CreatePostMutation, {
    update: (cache, { data }) => {
      const post = data?.createPost;
      if (!post) return;
      cache.modify({
        fields: {
          feed(existing, { toReference }) {
            const ref = toReference(post);
            if (!ref) return existing;
            const list = Array.isArray(existing) ? existing : [];
            return [ref, ...list];
          },
        },
      });
    },
  });

  const updateImage = (id: string, patch: Partial<ImageDraft>) =>
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img)),
    );

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setError(null);
    setExpanded(true);

    const drafts: ImageDraft[] = files.map((file) => ({
      id: crypto.randomUUID(),
      blobUrl: URL.createObjectURL(file),
      remoteUrl: null,
      status: "uploading",
    }));
    setImages((prev) => [...prev, ...drafts].slice(0, 10));

    if (fileInputRef.current) fileInputRef.current.value = "";

    drafts.forEach((draft, i) => {
      void processOne(draft.id, files[i]);
    });
  };

  const processOne = async (id: string, file: File) => {
    try {
      const r = await uploadImage(file);
      updateImage(id, { remoteUrl: r.url, status: "analyzing" });

      try {
        const { data } = await client.query({
          query: AnalyzeReceiptQuery,
          variables: { imageUrl: r.url },
          fetchPolicy: "network-only",
        });
        const ocr = data?.analyzeReceipt;
        // BE의 ReceiptAnalyzer가 confidence < threshold면 의도적으로 amount=null로
        // 떨군다 → amount 유무가 "신뢰할 수 있는 OCR"의 단일 신호.
        if (ocr && ocr.amount != null) {
          if (amountRef.current.trim() === "") {
            const next = String(ocr.amount);
            amountRef.current = next;
            setAmount(next);
          }
          if (ocr.item && itemRef.current.trim() === "") {
            itemRef.current = ocr.item;
            setItem(ocr.item);
          }
          if (ocr.tag && tagRef.current.trim() === "") {
            tagRef.current = ocr.tag;
            setTag(ocr.tag);
          }
          if (ocr.placeName && !placeRef.current) {
            try {
              const found = await searchPlaceByName(ocr.placeName);
              if (found && !placeRef.current) {
                placeRef.current = found;
                setPlace(found);
              }
            } catch {
              // 카카오 검색 실패는 폴백이 아니라 사용자가 PlacePicker로 직접 추가하면 됨
            }
          }
          setOcrNotice(null);
          setOcrRawText(null);
        } else if (ocr) {
          // 저신뢰도 — 자동 채움하지 않고 안내 + rawText 참고 표시
          setOcrNotice("OCR 결과 신뢰도가 낮습니다. 직접 입력해 주세요.");
          setOcrRawText(ocr.rawText ?? null);
        }
      } catch {
        // analyzeReceipt 호출 자체 실패 — 치명적 아님
      }

      updateImage(id, { status: "done" });
    } catch (err) {
      updateImage(id, {
        status: "failed",
        error: err instanceof Error ? err.message : "업로드 실패",
      });
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.blobUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const reset = () => {
    for (const img of images) URL.revokeObjectURL(img.blobUrl);
    setContent("");
    setTag("");
    setItem("");
    setAmount("");
    setPlace(null);
    setImages([]);
    setError(null);
    setOcrNotice(null);
    setOcrRawText(null);
    setExpanded(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const busyImages = images.some((img) => img.status === "uploading");
  const canSubmit =
    !submitting &&
    !busyImages &&
    content.trim().length > 0 &&
    images.every((img) => img.status !== "failed");

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    const trimmedAmount = amount.trim();
    const parsedAmount =
      trimmedAmount === "" ? null : Number(trimmedAmount.replace(/[^0-9]/g, ""));
    const uploadedUrls = images
      .filter((img) => img.remoteUrl)
      .map((img) => img.remoteUrl as string);
    setError(null);
    try {
      await createPost({
        variables: {
          input: {
            content: content.trim(),
            imageUrls: uploadedUrls.length > 0 ? uploadedUrls : null,
            tag: tag.trim() === "" ? null : tag.trim(),
            item: item.trim() === "" ? null : item.trim(),
            amount: parsedAmount,
            place: place
              ? {
                  latitude: place.latitude,
                  longitude: place.longitude,
                  name: place.name,
                  address: place.address ?? null,
                  externalId: place.externalId ?? null,
                  categoryName: place.categoryName ?? null,
                  categoryCode: place.categoryCode ?? null,
                }
              : null,
          },
        },
      });
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "게시 실패");
    }
  };

  const displayName = session?.user?.name ?? session?.user?.username ?? "you";
  const username = session?.user?.username ?? "";

  return (
    <form
      id={formId}
      onSubmit={onSubmit}
      className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]"
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <span className="bg-pay-gradient inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full p-[2px]">
          <span className="flex h-full w-full items-center justify-center rounded-full bg-[color:var(--paper)] text-[12px] font-semibold">
            {displayName.charAt(0).toUpperCase()}
          </span>
        </span>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onFocus={() => setExpanded(true)}
          rows={expanded ? 4 : 1}
          placeholder={
            username ? `${username}님, 오늘 어떤 흐름이었나요?` : "오늘 어떤 흐름이었나요?"
          }
          className="min-h-[34px] flex-1 resize-none rounded-lg bg-transparent px-2 py-1.5 text-[14px] outline-none placeholder:text-[color:var(--ink-soft)]/70"
        />
      </div>

      {(expanded || images.length > 0 || place) && (
        <div className="flex flex-col gap-3 px-4 pb-3">
          {images.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {images.map((img) => (
                <ImageThumb
                  key={img.id}
                  draft={img}
                  onRemove={() => removeImage(img.id)}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="지출 항목 (예: 김치찌개 정식)"
              className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
            />
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={
                images.some((img) => img.status === "analyzing")
                  ? "영수증 분석 중…"
                  : "금액(원)"
              }
              className="w-32 rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-right font-mono text-[13px] tabular-nums outline-none focus:border-[color:var(--foreground)]/40"
            />
          </div>

          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="태그 (#커피 같이 자유)"
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[12.5px] outline-none focus:border-[color:var(--foreground)]/40"
          />

          <PlacePicker value={place} onChange={setPlace} />

          {ocrNotice && (
            <div className="flex flex-col gap-1 rounded-md border border-[color:var(--rule)] bg-[color:var(--rule)]/20 px-3 py-2">
              <p className="text-[11.5px] text-[color:var(--ink-soft)]">
                {ocrNotice}
              </p>
              {ocrRawText && ocrRawText.trim().length > 0 && (
                <details className="text-[11px] text-[color:var(--ink-soft)]/80">
                  <summary className="cursor-pointer">OCR 원문 보기</summary>
                  <pre className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap font-mono text-[10.5px] leading-snug">
                    {ocrRawText}
                  </pre>
                </details>
              )}
            </div>
          )}

          {error && (
            <p className="text-[12px] text-[color:var(--danger)]">{error}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[color:var(--rule)] px-3 py-2">
        <div className="flex items-center gap-1">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-[color:var(--ink-soft)] transition-colors hover:bg-[color:var(--rule)]/40 hover:text-[color:var(--foreground)]">
            <CameraIcon />
            사진
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={onPickFiles}
            />
          </label>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              type="button"
              onClick={reset}
              disabled={submitting}
              className="rounded-full px-3 py-1 text-[12px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--foreground)] disabled:opacity-50"
            >
              취소
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter] hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting
              ? "게시 중…"
              : busyImages
                ? "업로드 중…"
                : "게시"}
          </button>
        </div>
      </div>
    </form>
  );
}

function ImageThumb({
  draft,
  onRemove,
}: {
  draft: ImageDraft;
  onRemove: () => void;
}) {
  return (
    <div className="group/thumb relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={draft.blobUrl}
        alt=""
        className="h-full w-full object-cover"
      />

      {draft.status !== "done" && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[10px] font-medium text-white">
          {draft.status === "uploading" && (
            <>
              <Spinner />
              <span>업로드 중</span>
            </>
          )}
          {draft.status === "analyzing" && (
            <>
              <Spinner />
              <span>영수증 분석…</span>
            </>
          )}
          {draft.status === "failed" && (
            <span className="px-1 text-center leading-tight">
              {draft.error || "실패"}
            </span>
          )}
        </div>
      )}

      <button
        type="button"
        aria-label="이미지 제거"
        onClick={onRemove}
        className="absolute right-1 top-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-[11px] leading-none text-white opacity-0 transition-opacity group-hover/thumb:opacity-100"
      >
        ×
      </button>
    </div>
  );
}

function Spinner() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      className="animate-spin"
      aria-hidden
    >
      <path d="M12 3a9 9 0 0 1 9 9" />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 7h3l2-2h8l2 2h3v12H3z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}
