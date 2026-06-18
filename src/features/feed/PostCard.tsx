"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import type { ThemePreset, NameEmphasis, NameFont } from "@/gql/graphql";
import { EmphasizedName } from "@/features/profile/EmphasizedName";
import { toAbsoluteMediaUrl } from "@/lib/upload";
import { THEME_BY_KEY, type ThemeStyle } from "@/features/subscription/themes";
import { Bookmark, Bubble, Dots, Heart, Send } from "@/components/insta-icons";
import { PostCarousel } from "./PostCarousel";
import { CommentSheet } from "./CommentSheet";
import { PlacePicker, type PlaceDraft } from "./PlacePicker";
import { ShareToDirectSheet } from "@/features/messages/ShareToDirectSheet";

type Author = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
  activeTheme?: ThemePreset | null;
  activeEmphasis?: NameEmphasis | null;
  activeFont?: NameFont | null;
  isSubscriber?: boolean | null;
};

type PreviewComment = {
  id: string;
  content: string;
  author: Pick<Author, "id" | "username">;
};

type Place = {
  latitude: number;
  longitude: number;
  name: string;
  address?: string | null;
  externalId?: string | null;
  categoryName?: string | null;
  categoryCode?: string | null;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
  imageUrls: ReadonlyArray<string>;
  tag?: string | null;
  item?: string | null;
  amount?: number | null;
  place?: Place | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
  author: Author;
  previewComment?: PreviewComment | null;
  theme?: ThemePreset | null;
};

const LikeMutation = graphql(`
  mutation LikePost($postId: ID!) {
    likePost(postId: $postId) {
      id
      likeCount
      viewerHasLiked
    }
  }
`);

const UnlikeMutation = graphql(`
  mutation UnlikePost($postId: ID!) {
    unlikePost(postId: $postId) {
      id
      likeCount
      viewerHasLiked
    }
  }
`);

const BookmarkMutation = graphql(`
  mutation BookmarkPost($postId: ID!) {
    bookmarkPost(postId: $postId) {
      id
      viewerHasBookmarked
    }
  }
`);

const UnbookmarkMutation = graphql(`
  mutation UnbookmarkPost($postId: ID!) {
    unbookmarkPost(postId: $postId) {
      id
      viewerHasBookmarked
    }
  }
`);

const DeletePostMutation = graphql(`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id)
  }
`);

const UpdatePostMutation = graphql(`
  mutation UpdatePost($id: ID!, $input: UpdatePostInput!) {
    updatePost(id: $id, input: $input) {
      id
      content
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
      updatedAt
    }
  }
`);

export function PostCard({ post }: { post: Post }) {
  const { data: session } = useSession();
  const isMine = session?.user?.id != null && session.user.id === post.author.id;

  const [editing, setEditing] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  const themeKey = post.theme ?? post.author.activeTheme ?? null;
  const t = themeKey ? THEME_BY_KEY[themeKey] : null;

  if (editing) {
    return (
      <article className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
        <PostEditor
          post={post}
          onClose={() => setEditing(false)}
        />
      </article>
    );
  }

  return (
    <>
      <article
        className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]"
        style={t ? { backgroundImage: `linear-gradient(${t.tint}, ${t.tint})` } : undefined}
      >
        {t && <div className="h-1 w-full" style={{ background: t.gradient }} aria-hidden />}
        <PostHeader post={post} isMine={isMine} onEdit={() => setEditing(true)} theme={t} />

        {post.imageUrls.length > 0 && (
          <PostCarousel
            imageUrls={post.imageUrls}
            item={post.item}
            amount={post.amount}
            theme={t}
          />
        )}

        <PostActions
          post={post}
          hasCover={post.imageUrls.length > 0}
          onOpenComments={() => setSheetOpen(true)}
          onOpenShare={() => setShareOpen(true)}
          theme={t}
        />
      </article>
      <CommentSheet
        postId={post.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
      {shareOpen && (
        <ShareToDirectSheet
          postId={post.id}
          open
          onClose={() => setShareOpen(false)}
        />
      )}
    </>
  );
}

function PostHeader({
  post,
  isMine,
  onEdit,
  theme,
}: {
  post: Post;
  isMine: boolean;
  onEdit: () => void;
  theme: ThemeStyle | null;
}) {
  return (
    <header className="flex items-center gap-2.5 px-4 py-3">
      <Link
        href={`/u/${post.author.username}`}
        aria-label={`${post.author.username} 프로필로 이동`}
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full p-[2px] ${theme ? "" : "bg-pay-gradient"}`}
        style={theme ? { background: theme.gradient } : undefined}
      >
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12px] font-semibold tracking-wide">
          {post.author.avatarUrl ? (
            <Image
              src={toAbsoluteMediaUrl(post.author.avatarUrl)}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            post.author.displayName.charAt(0).toUpperCase()
          )}
        </span>
      </Link>
      <div className="flex flex-col leading-tight">
        <Link
          href={`/u/${post.author.username}`}
          className="text-[13px] font-semibold transition-colors hover:text-[color:var(--pay-forest)]"
        >
          <EmphasizedName name={post.author.username} font={post.author.activeFont} emphasis={post.author.activeEmphasis} theme={post.author.activeTheme} />
        </Link>
        <div className="flex items-center gap-1.5 text-[11px] text-[color:var(--ink-soft)]">
          <time dateTime={post.createdAt} title={post.createdAt}>
            {formatDateTime(post.createdAt)}
          </time>
          {post.place && (
            <>
              <span aria-hidden>·</span>
              <PlaceLine place={post.place} />
            </>
          )}
        </div>
      </div>
      <div className="ml-auto">
        {isMine ? (
          <AuthorMenu postId={post.id} onEdit={onEdit} />
        ) : (
          <Dots className="h-4 w-4 text-[color:var(--ink-soft)]" />
        )}
      </div>
    </header>
  );
}

function PostActions({
  post,
  hasCover,
  onOpenComments,
  onOpenShare,
  theme,
}: {
  post: Post;
  hasCover: boolean;
  onOpenComments: () => void;
  onOpenShare: () => void;
  theme: ThemeStyle | null;
}) {
  const [like] = useMutation(LikeMutation);
  const [unlike] = useMutation(UnlikeMutation);
  const [bookmark] = useMutation(BookmarkMutation);
  const [unbookmark] = useMutation(UnbookmarkMutation);

  const toggleLike = () => {
    if (post.viewerHasLiked) {
      void unlike({
        variables: { postId: post.id },
        optimisticResponse: {
          unlikePost: {
            id: post.id,
            likeCount: Math.max(0, post.likeCount - 1),
            viewerHasLiked: false,
          },
        },
      });
    } else {
      void like({
        variables: { postId: post.id },
        optimisticResponse: {
          likePost: {
            id: post.id,
            likeCount: post.likeCount + 1,
            viewerHasLiked: true,
          },
        },
      });
    }
  };

  const toggleBookmark = () => {
    if (post.viewerHasBookmarked) {
      void unbookmark({
        variables: { postId: post.id },
        optimisticResponse: {
          unbookmarkPost: {
            id: post.id,
            viewerHasBookmarked: false,
          },
        },
      });
    } else {
      void bookmark({
        variables: { postId: post.id },
        optimisticResponse: {
          bookmarkPost: {
            id: post.id,
            viewerHasBookmarked: true,
          },
        },
      });
    }
  };

  return (
    <footer className="flex flex-col gap-2 px-4 pb-4 pt-3">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleLike}
          aria-label={post.viewerHasLiked ? "좋아요 취소" : "좋아요"}
          className="transition-transform active:scale-90"
        >
          <Heart
            filled={post.viewerHasLiked}
            className={`h-[22px] w-[22px] ${
              post.viewerHasLiked
                ? "text-[color:var(--pay)]"
                : "text-[color:var(--foreground)]"
            }`}
          />
        </button>
        <button
          type="button"
          aria-label="댓글"
          onClick={onOpenComments}
          className="transition-transform active:scale-90"
        >
          <Bubble className="h-[22px] w-[22px] text-[color:var(--foreground)]" />
        </button>
        <button
          type="button"
          aria-label="메시지로 공유"
          onClick={onOpenShare}
          className="transition-transform active:scale-90"
        >
          <Send className="h-[22px] w-[22px] text-[color:var(--foreground)]" />
        </button>
        <button
          type="button"
          onClick={toggleBookmark}
          aria-label={post.viewerHasBookmarked ? "북마크 해제" : "북마크"}
          className="ml-auto transition-transform active:scale-90"
        >
          <Bookmark
            filled={post.viewerHasBookmarked}
            className={`h-[22px] w-[22px] ${
              post.viewerHasBookmarked
                ? "text-[color:var(--pay)]"
                : "text-[color:var(--foreground)]"
            }`}
          />
        </button>
      </div>
      {!hasCover && (post.item || post.amount != null) && (
        <div className="flex w-fit items-center gap-1.5">
          {post.item && (
            <span
              className="inline-flex items-center rounded-full bg-[color:var(--pay)]/10 px-2.5 py-0.5 text-[12px] font-medium text-[color:var(--pay-forest)]"
              style={theme ? { backgroundColor: `${theme.accent}1a`, color: theme.accent } : undefined}
            >
              {post.item}
            </span>
          )}
          {post.amount != null && (
            <span
              className="inline-flex items-center rounded-full bg-[color:var(--pay)] px-2.5 py-0.5 font-mono text-[11px] font-semibold tabular-nums text-[color:var(--pay-on)]"
              style={theme ? { background: theme.accent, color: theme.on } : undefined}
            >
              {formatKrw(post.amount)}
            </span>
          )}
        </div>
      )}
      <p className="text-[13px] font-semibold">
        좋아요 {post.likeCount.toLocaleString()}개
      </p>
      <p className="text-[13.5px] leading-snug">
        <Link
          href={`/u/${post.author.username}`}
          className="font-semibold transition-colors hover:text-[color:var(--pay-forest)]"
        >
          {post.author.username}
        </Link>{" "}
        <span className="text-[color:var(--foreground)]/85">{post.content}</span>
        {post.tag && (
          <span
            className="ml-1.5 text-[color:var(--pay-forest)]"
            style={theme ? { color: theme.accent } : undefined}
          >
            #{post.tag}
          </span>
        )}
      </p>
      {post.previewComment && (
        <button
          type="button"
          onClick={onOpenComments}
          className="no-scale text-left text-[13px] leading-snug text-[color:var(--foreground)]/80 transition-colors hover:text-[color:var(--foreground)]"
        >
          <span className="font-semibold">
            {post.previewComment.author.username}
          </span>{" "}
          <span className="text-[color:var(--foreground)]/75">
            {post.previewComment.content}
          </span>
        </button>
      )}
      <div className="flex items-center gap-3 text-[12px] text-[color:var(--ink-soft)]">
        {post.commentCount > 0 && (
          <button
            type="button"
            onClick={onOpenComments}
            className="transition-colors hover:text-[color:var(--foreground)]"
          >
            댓글 {post.commentCount}개 모두 보기
          </button>
        )}
        {post.shareCount > 0 && (
          <span className="font-mono tabular-nums">
            ↗ {post.shareCount.toLocaleString()}
          </span>
        )}
      </div>
    </footer>
  );
}

function AuthorMenu({ postId, onEdit }: { postId: string; onEdit: () => void }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [deletePost, { loading: deleting }] = useMutation(DeletePostMutation);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const onDelete = async () => {
    if (!window.confirm("게시물을 삭제할까요? 되돌릴 수 없습니다.")) return;
    try {
      const { data } = await deletePost({
        variables: { id: postId },
        // 서버가 실제로 지웠을 때(deletePost === true)만 캐시에서 제거한다.
        // false/에러인데 캐시만 비우면 "사라졌다가 새로고침하면 부활"하는 illusion 이 생긴다.
        update: (cache, { data: result }) => {
          if (!result?.deletePost) return;
          const id = cache.identify({ __typename: "Post", id: postId });
          cache.modify({
            fields: {
              feed(existing: ReadonlyArray<{ __ref: string }> = [], { readField }) {
                return existing.filter((ref) => readField("id", ref) !== postId);
              },
            },
          });
          if (id) cache.evict({ id });
          cache.gc();
        },
      });
      if (!data?.deletePost) {
        window.alert("삭제에 실패했어요. 잠시 후 다시 시도해 주세요.");
      }
    } catch (e) {
      // FORBIDDEN(토큰 없음/만료) 등 — 조용히 실패하지 말고 원인을 노출한다.
      const msg = e instanceof Error ? e.message : "알 수 없는 오류";
      window.alert(`삭제에 실패했어요: ${msg}`);
    } finally {
      setOpen(false);
    }
  };

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        aria-label="더보기"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--rule)]/50"
      >
        <Dots className="h-4 w-4 text-[color:var(--ink-soft)]" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-10 w-36 overflow-hidden rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] py-1 shadow-[0_12px_30px_-18px_rgba(20,12,30,0.4)]"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="block w-full px-3 py-2 text-left text-[13px] hover:bg-[color:var(--rule)]/40"
          >
            수정
          </button>
          <button
            type="button"
            role="menuitem"
            disabled={deleting}
            onClick={onDelete}
            className="block w-full px-3 py-2 text-left text-[13px] text-[color:var(--danger)] hover:bg-[color:var(--danger)]/10 disabled:opacity-50"
          >
            {deleting ? "삭제 중…" : "삭제"}
          </button>
        </div>
      )}
    </div>
  );
}

function PostEditor({
  post,
  onClose,
}: {
  post: Pick<Post, "id" | "content" | "tag" | "item" | "amount" | "place">;
  onClose: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [tag, setTag] = useState(post.tag ?? "");
  const [item, setItem] = useState(post.item ?? "");
  const [amount, setAmount] = useState(
    post.amount != null ? String(post.amount) : "",
  );
  const [place, setPlace] = useState<PlaceDraft | null>(
    post.place
      ? {
          latitude: post.place.latitude,
          longitude: post.place.longitude,
          name: post.place.name,
          address: post.place.address ?? null,
          externalId: post.place.externalId ?? null,
        }
      : null,
  );
  const [update, { loading }] = useMutation(UpdatePostMutation);
  const formId = useId();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length === 0) return;
    const trimmedAmount = amount.trim();
    const parsedAmount =
      trimmedAmount === "" ? null : Number(trimmedAmount.replace(/[^0-9]/g, ""));
    if (parsedAmount != null && !Number.isFinite(parsedAmount)) return;
    await update({
      variables: {
        id: post.id,
        input: {
          content: content.trim(),
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
    onClose();
  };

  return (
    <form id={formId} onSubmit={onSubmit} className="flex flex-col gap-3 p-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--ink-soft)]">
        게시물 수정
      </p>
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={4}
        className="resize-none rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[14px] outline-none focus:border-[color:var(--foreground)]/40"
        placeholder="내용"
      />
      <div className="grid grid-cols-[1fr_auto] gap-2">
        <input
          value={item}
          onChange={(e) => setItem(e.target.value)}
          className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
          placeholder="지출 항목 (예: 김치찌개 정식)"
        />
        <input
          inputMode="numeric"
          pattern="[0-9]*"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          className="w-32 rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-right font-mono text-[13px] tabular-nums outline-none focus:border-[color:var(--foreground)]/40"
          placeholder="금액(원)"
        />
      </div>
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[12.5px] outline-none focus:border-[color:var(--foreground)]/40"
        placeholder="태그 (#커피 같이 자유)"
      />
      <PlacePicker value={place} onChange={setPlace} />
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="rounded-full border border-[color:var(--rule)] px-4 py-1.5 text-[12.5px] text-[color:var(--ink-soft)] transition-colors hover:border-[color:var(--pay)]/40 hover:text-[color:var(--foreground)] disabled:opacity-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={loading || content.trim().length === 0}
          className="rounded-full bg-pay px-4 py-1.5 text-[12.5px] font-semibold text-[color:var(--pay-on)] shadow-[0_6px_18px_-10px_rgba(3,199,90,0.7)] transition-[filter] hover:brightness-105 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? "저장 중…" : "저장"}
        </button>
      </div>
    </form>
  );
}

function PlaceLine({ place }: { place: Place }) {
  const label =
    place.name.trim() ||
    place.address?.trim() ||
    `${place.latitude.toFixed(4)}, ${place.longitude.toFixed(4)}`;
  // externalId(카카오 place ID)가 있으면 가게 상세 페이지로 직링크 → 사용자에게 더 유용
  // (좌표 핀보다 영업시간·리뷰·사진까지 보임). 없을 때만 좌표 핀 fallback.
  const href = place.externalId
    ? `https://place.map.kakao.com/${encodeURIComponent(place.externalId)}`
    : `https://map.kakao.com/link/map/${encodeURIComponent(label)},${place.latitude},${place.longitude}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={place.address ?? label}
      className="inline-flex max-w-[180px] items-center gap-0.5 truncate transition-colors hover:text-[color:var(--foreground)]"
    >
      <PinIcon />
      <span className="truncate">{label}</span>
    </a>
  );
}

function PinIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M20 10c0 7-8 12-8 12s-8-5-8-12a8 8 0 0 1 16 0Z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

const krwFormatter = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

function formatKrw(value: number): string {
  return krwFormatter.format(value);
}

function formatDateTime(iso: string): string {
  const t = new Date(iso);
  if (Number.isNaN(t.getTime())) return iso;
  const y = t.getFullYear();
  const m = String(t.getMonth() + 1).padStart(2, "0");
  const d = String(t.getDate()).padStart(2, "0");
  const hh = String(t.getHours()).padStart(2, "0");
  const mm = String(t.getMinutes()).padStart(2, "0");
  return `${y}.${m}.${d} ${hh}:${mm}`;
}
