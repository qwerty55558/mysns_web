"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState } from "react";
import { useMutation } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { Bookmark, Bubble, Dots, Heart, Send } from "@/components/insta-icons";
import { PostCarousel } from "./PostCarousel";

type Author = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string | null;
};

type Post = {
  id: string;
  content: string;
  createdAt: string;
  imageUrls: ReadonlyArray<string>;
  tag?: string | null;
  likeCount: number;
  commentCount: number;
  shareCount: number;
  viewerHasLiked: boolean;
  viewerHasBookmarked: boolean;
  author: Author;
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
      updatedAt
    }
  }
`);

export function PostCard({ post }: { post: Post }) {
  const { data: session } = useSession();
  const isMine = session?.user?.id != null && session.user.id === post.author.id;

  const [editing, setEditing] = useState(false);

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
    <article className="overflow-hidden rounded-2xl bg-[color:var(--paper)] ring-1 ring-black/5 shadow-[0_18px_38px_-28px_rgba(20,12,30,0.45)]">
      <PostHeader post={post} isMine={isMine} onEdit={() => setEditing(true)} />

      {post.imageUrls.length > 0 && (
        <PostCarousel imageUrls={post.imageUrls} tag={post.tag} />
      )}

      <PostActions post={post} hasCover={post.imageUrls.length > 0} />
    </article>
  );
}

function PostHeader({
  post,
  isMine,
  onEdit,
}: {
  post: Post;
  isMine: boolean;
  onEdit: () => void;
}) {
  return (
    <header className="flex items-center gap-2.5 px-4 py-3">
      <span className="bg-pay-gradient inline-flex h-9 w-9 items-center justify-center rounded-full p-[2px]">
        <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[12px] font-semibold tracking-wide">
          {post.author.avatarUrl ? (
            <Image
              src={post.author.avatarUrl}
              alt=""
              width={36}
              height={36}
              className="h-full w-full object-cover"
            />
          ) : (
            post.author.displayName.charAt(0).toUpperCase()
          )}
        </span>
      </span>
      <div className="flex flex-col leading-tight">
        <span className="text-[13px] font-semibold">{post.author.username}</span>
        <time
          dateTime={post.createdAt}
          title={post.createdAt}
          className="text-[11px] text-[color:var(--ink-soft)]"
        >
          {formatDateTime(post.createdAt)}
        </time>
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

function PostActions({ post, hasCover }: { post: Post; hasCover: boolean }) {
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
        <button type="button" aria-label="댓글" className="transition-transform active:scale-90">
          <Bubble className="h-[22px] w-[22px] text-[color:var(--foreground)]" />
        </button>
        <button type="button" aria-label="공유" className="transition-transform active:scale-90">
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
      {!hasCover && post.tag && (
        <span className="inline-flex w-fit items-center rounded-full bg-[color:var(--pay)]/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--pay-forest)]">
          {post.tag}
        </span>
      )}
      <p className="text-[13px] font-semibold">
        좋아요 {post.likeCount.toLocaleString()}개
      </p>
      <p className="text-[13.5px] leading-snug">
        <span className="font-semibold">{post.author.username}</span>{" "}
        <span className="text-[color:var(--foreground)]/85">{post.content}</span>
      </p>
      <div className="flex items-center gap-3 text-[12px] text-[color:var(--ink-soft)]">
        {post.commentCount > 0 && (
          <button type="button" className="hover:text-[color:var(--foreground)]">
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
    await deletePost({
      variables: { id: postId },
      update: (cache) => {
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
    setOpen(false);
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
  post: Pick<Post, "id" | "content" | "tag">;
  onClose: () => void;
}) {
  const [content, setContent] = useState(post.content);
  const [tag, setTag] = useState(post.tag ?? "");
  const [update, { loading }] = useMutation(UpdatePostMutation);
  const formId = useId();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim().length === 0) return;
    await update({
      variables: {
        id: post.id,
        input: {
          content: content.trim(),
          tag: tag.trim() === "" ? null : tag.trim(),
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
      <input
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
        placeholder="태그 (옵션)"
      />
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
