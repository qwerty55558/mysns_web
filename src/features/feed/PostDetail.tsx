"use client";

import Link from "next/link";
import { useQuery } from "@apollo/client/react";
import { useSession } from "next-auth/react";
import { graphql } from "@/gql";
import { PostCard } from "./PostCard";
import { InlineComments } from "./InlineComments";
import { CrowdfundingChecklist } from "@/features/crowdfunding/CrowdfundingChecklist";

const PostQuery = graphql(`
  query Post($id: ID!) {
    post(id: $id) {
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
      type
      crowdfunding {
        id
        goalAmount
        currentAmount
        backerCount
        progressPercent
        status
        deadline
        canCloseEarly
        viewerBacking {
          id
          amount
          status
        }
        checklist {
          id
          text
          done
          position
        }
      }
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

export function PostDetail({ id }: { id: string }) {
  const { data, loading, error } = useQuery(PostQuery, { variables: { id } });
  const { data: sessionData } = useSession();

  if (loading)
    return (
      <p className="text-sm text-[color:var(--ink-soft)]">게시물 불러오는 중…</p>
    );
  if (error)
    return (
      <p className="text-sm text-[color:var(--danger)]">에러: {error.message}</p>
    );

  const post = data?.post;
  const isCreator = sessionData?.user?.id === post?.author.id;
  if (!post)
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-[color:var(--rule)] py-12 text-center">
        <p className="text-[13.5px] font-medium">게시물을 찾을 수 없습니다.</p>
        <Link
          href="/home"
          className="text-[12.5px] text-[color:var(--pay-forest)] hover:underline"
        >
          홈으로 돌아가기
        </Link>
      </div>
    );

  return (
    <div className="flex flex-col gap-4">
      <PostCard post={post} />
      {post.type === "CROWDFUNDING" &&
        post.crowdfunding &&
        post.crowdfunding.status === "SUCCEEDED" && (
          <CrowdfundingChecklist
            crowdfundingId={post.crowdfunding.id}
            items={post.crowdfunding.checklist}
            isCreator={isCreator}
          />
        )}
      <InlineComments postId={post.id} />
    </div>
  );
}
