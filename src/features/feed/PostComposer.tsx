"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useApolloClient, useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { uploadImage } from "@/lib/upload";
import { CreateSplitMutation } from "@/features/splits/queries";
import { SplitParticipantPicker, type Friend } from "@/features/splits/SplitParticipantPicker";
import { formatWon } from "@/features/wallet/format";
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
      theme
      author {
        id
        username
        displayName
        avatarUrl
        activeTheme
        activeEmphasis
        activeFont
        isSubscriber
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
  query AnalyzeReceipt($imageUrls: [String!]!) {
    analyzeReceipt(imageUrls: $imageUrls) {
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
  kind: "photo" | "receipt";
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
  const [splitNotice, setSplitNotice] = useState<string | null>(null);
  // OCR 결과 안내 (저신뢰도 안내 + rawText 참고 표시)
  const [ocrNotice, setOcrNotice] = useState<string | null>(null);
  const [ocrRawText, setOcrRawText] = useState<string | null>(null);
  const [receiptAnalyzing, setReceiptAnalyzing] = useState(false);
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
  // 이미 분석한 영수증 URL 조합을 기억 — 같은 세트 중복 호출 방지
  const analyzedReceiptKeyRef = useRef("");

  useEffect(() => {
    return () => {
      for (const img of imagesRef.current) URL.revokeObjectURL(img.blobUrl);
    };
  }, []);

  // 영수증으로 지정한 이미지들이 모두 업로드되면, URL 배열을 모아 한 번에
  // analyzeReceipt(imageUrls) 로 합산 분석한다. (사진은 분석하지 않음)
  useEffect(() => {
    const receipts = images.filter((img) => img.kind === "receipt");
    if (receipts.length === 0) return;
    if (receipts.some((img) => img.status === "uploading")) return; // 업로드 끝날 때까지 대기
    const urls = receipts
      .filter((img) => img.remoteUrl)
      .map((img) => img.remoteUrl as string);
    if (urls.length === 0) return;
    const key = [...urls].sort().join("|");
    if (key === analyzedReceiptKeyRef.current) return; // 동일 세트 재분석 방지
    analyzedReceiptKeyRef.current = key;

    let cancelled = false;
    void (async () => {
      setReceiptAnalyzing(true);
      try {
        const { data } = await client.query({
          query: AnalyzeReceiptQuery,
          variables: { imageUrls: urls },
          fetchPolicy: "network-only",
        });
        if (cancelled) return;
        const ocr = data?.analyzeReceipt;
        // BE는 confidence < 임계값이면 amount=null로 떨군다 → amount 유무가 신뢰 신호.
        // prefill은 비어있는 칸만 채운다(추천-only, 사용자 입력 보존).
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
              if (found && !placeRef.current && !cancelled) {
                placeRef.current = found;
                setPlace(found);
              }
            } catch {
              // 카카오 검색 실패 — 사용자가 PlacePicker로 직접 추가
            }
          }
          setOcrNotice(null);
          setOcrRawText(null);
        } else if (ocr) {
          setOcrNotice("OCR 결과 신뢰도가 낮습니다. 직접 입력해 주세요.");
          setOcrRawText(ocr.rawText ?? null);
        }
      } catch {
        // analyzeReceipt 호출 실패 — 치명적 아님
      } finally {
        if (!cancelled) setReceiptAnalyzing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [images, client]);

  const [createSplit] = useMutation(CreateSplitMutation);
  const [splitOn, setSplitOn] = useState(false);
  const [splitParticipants, setSplitParticipants] = useState<Friend[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  const toggleSplit = () => {
    if (splitOn) {
      setSplitOn(false);
      setSplitParticipants([]);
    } else {
      setSplitOn(true);
      setPickerOpen(true);
    }
  };

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

  const onPickFiles =
    (kind: ImageDraft["kind"]) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target;
      const files = Array.from(input.files ?? []);
      if (files.length === 0) return;
      setError(null);
      setExpanded(true);

      const drafts: ImageDraft[] = files.map((file) => ({
        id: crypto.randomUUID(),
        blobUrl: URL.createObjectURL(file),
        remoteUrl: null,
        status: "uploading",
        kind,
      }));
      setImages((prev) => [...prev, ...drafts].slice(0, 10));

      input.value = "";

      drafts.forEach((draft, i) => {
        void processOne(draft.id, files[i], kind);
      });
    };

  const processOne = async (
    id: string,
    file: File,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _kind: ImageDraft["kind"],
  ) => {
    try {
      const r = await uploadImage(file);
      updateImage(id, { remoteUrl: r.url, status: "done" });
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
    setReceiptAnalyzing(false);
    analyzedReceiptKeyRef.current = "";
    setSplitOn(false);
    setSplitParticipants([]);
    setPickerOpen(false);
    setExpanded(false);
  };

  const busyImages = images.some((img) => img.status === "uploading");
  const canSubmit =
    !submitting &&
    !busyImages &&
    !receiptAnalyzing &&
    content.trim().length > 0 &&
    images.every((img) => img.status !== "failed");

  const amountNum = Number(amount.replace(/[^0-9]/g, "")) || 0;

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
    setSplitNotice(null);
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
      let splitFailed = false;
      if (splitOn && splitParticipants.length > 0 && parsedAmount && parsedAmount > 0) {
        try {
          await createSplit({
            variables: {
              input: {
                totalAmount: parsedAmount,
                memo: item.trim() === "" ? null : item.trim(),
                participants: splitParticipants.map((p) => ({ userId: p.id })),
              },
            },
            refetchQueries: ["MySplitBills", "SettlementHistory", "PendingSplitRequests"],
          });
        } catch {
          splitFailed = true;
        }
      }
      reset();
      if (splitFailed) {
        setSplitNotice("게시는 완료됐지만 1/N 정산 요청 전송에 실패했어요. 1/N 탭에서 다시 시도해주세요.");
      }
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
            username ? `${username}님, 오늘은 어떤 일이 있었나요?` : "오늘은 어떤 일이 있었나요"
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
                  analyzing={receiptAnalyzing}
                />
              ))}
            </div>
          )}

          <div className="grid grid-cols-[1fr_auto] gap-2">
            <input
              value={item}
              onChange={(e) => setItem(e.target.value)}
              placeholder="지출 항목 (예: 김치찌개 정식)"
              disabled={receiptAnalyzing}
              className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <input
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder={receiptAnalyzing ? "영수증 분석 중…" : "금액(원)"}
              disabled={receiptAnalyzing}
              className="w-32 rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-right font-mono text-[13px] tabular-nums outline-none focus:border-[color:var(--foreground)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <input
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            placeholder="태그 (#커피 같이 자유)"
            disabled={receiptAnalyzing}
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[12.5px] outline-none focus:border-[color:var(--foreground)]/40 disabled:opacity-50 disabled:cursor-not-allowed"
          />

          <PlacePicker value={place} onChange={setPlace} />

          {amountNum > 0 && (
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer select-none" onClick={toggleSplit}>
                <span
                  role="checkbox"
                  aria-checked={splitOn}
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      toggleSplit();
                    }
                  }}
                  className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors ${
                    splitOn
                      ? "border-transparent bg-pay text-[color:var(--pay-on)]"
                      : "border-[color:var(--rule)] text-transparent"
                  }`}
                >
                  ✓
                </span>
                <span className="text-[13px] text-[color:var(--foreground)]">1/N 정산하기</span>
              </label>
              {splitOn && splitParticipants.length > 0 && (
                <div className="flex items-center gap-2 rounded-full border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-1.5">
                  <span className="flex-1 truncate text-[12.5px] text-[color:var(--ink-soft)]">
                    {splitParticipants.length}명에게 1/N · 1인당{" "}
                    {formatWon(Math.floor(amountNum / (splitParticipants.length + 1)))}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerOpen(true)}
                    className="shrink-0 text-[11.5px] font-medium text-[color:var(--pay-forest)] hover:text-[color:var(--pay)]"
                  >
                    수정
                  </button>
                </div>
              )}
              {splitOn && splitParticipants.length === 0 && (
                <p className="text-[12px] text-[color:var(--ink-soft)]">
                  정산할 친구를 선택해주세요.
                </p>
              )}
            </div>
          )}

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

      {pickerOpen && (
        <SplitParticipantPicker
          amount={amountNum}
          initialSelected={splitParticipants}
          onConfirm={(list) => {
            setSplitParticipants(list);
            setSplitOn(list.length > 0);
            setPickerOpen(false);
          }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {splitNotice && (
        <div className="flex items-center gap-2 border-t border-[color:var(--rule)] bg-[color:var(--danger)]/5 px-4 py-2">
          <p role="alert" className="flex-1 text-[12px] text-[color:var(--danger)]">{splitNotice}</p>
          <button
            type="button"
            onClick={() => setSplitNotice(null)}
            aria-label="닫기"
            className="shrink-0 text-[color:var(--ink-soft)] hover:text-[color:var(--foreground)]"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center justify-between border-t border-[color:var(--rule)] px-3 py-2">
        <div className="flex items-center gap-1">
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-[color:var(--ink-soft)] transition-colors hover:bg-[color:var(--rule)]/40 hover:text-[color:var(--foreground)]">
            <CameraIcon />
            사진
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={onPickFiles("photo")}
            />
          </label>
          <label className="inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-1 text-[12px] text-[color:var(--ink-soft)] transition-colors hover:bg-[color:var(--rule)]/40 hover:text-[color:var(--foreground)]">
            <ReceiptIcon />
            영수증
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              multiple
              hidden
              onChange={onPickFiles("receipt")}
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
                : receiptAnalyzing
                  ? "영수증 분석 중…"
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
  analyzing,
}: {
  draft: ImageDraft;
  onRemove: () => void;
  analyzing?: boolean;
}) {
  // 합산 분석 중인 영수증 썸네일에 펜딩 오버레이를 띄운다.
  const showAnalyzing =
    !!analyzing && draft.kind === "receipt" && draft.status === "done";
  return (
    <div className="group/thumb relative h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={draft.blobUrl}
        alt=""
        className="h-full w-full object-cover"
      />

      {(draft.status !== "done" || showAnalyzing) && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/40 text-[10px] font-medium text-white">
          {draft.status === "uploading" && (
            <>
              <Spinner />
              <span>업로드 중</span>
            </>
          )}
          {showAnalyzing && (
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

      <span className="pointer-events-none absolute left-1 top-1 rounded-full bg-black/55 px-1.5 py-0.5 text-[9px] font-medium leading-none text-white">
        {draft.kind === "receipt" ? "영수증" : "사진"}
      </span>

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

function ReceiptIcon() {
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
      <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
      <path d="M9 7h6M9 11h6M9 15h4" />
    </svg>
  );
}
