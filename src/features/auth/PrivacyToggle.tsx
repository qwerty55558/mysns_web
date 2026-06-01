"use client";

import { useState } from "react";
import { useMutation, useQuery } from "@apollo/client/react";
import { graphql } from "@/gql";

const MePrivacyQuery = graphql(`
  query MePrivacy {
    me {
      id
      privateAccount
    }
  }
`);

const UpdateMePrivacyMutation = graphql(`
  mutation UpdateMePrivacy($privateAccount: Boolean!) {
    updateMe(input: { privateAccount: $privateAccount }) {
      id
      privateAccount
    }
  }
`);

export function PrivacyToggle() {
  const { data, loading } = useQuery(MePrivacyQuery);
  const [updateMe, { loading: saving }] = useMutation(UpdateMePrivacyMutation);
  const [error, setError] = useState<string | null>(null);

  const current = data?.me?.privateAccount ?? false;
  const busy = loading || saving;

  const onToggle = async () => {
    if (busy) return;
    setError(null);
    try {
      await updateMe({
        variables: { privateAccount: !current },
        optimisticResponse: {
          updateMe: {
            id: data?.me?.id ?? "",
            privateAccount: !current,
          },
        },
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "변경 실패");
    }
  };

  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-[13.5px]">비공개 계정</span>
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">
            팔로워만 게시물을 볼 수 있고, 새 팔로워는 승낙해야 추가돼요.
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={current}
          aria-busy={busy}
          disabled={busy}
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
            current ? "bg-pay" : "bg-[color:var(--rule)]"
          } ${busy ? "opacity-60" : ""}`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
              current ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>
      {error && (
        <p className="mt-1 text-[11.5px] text-[color:var(--danger)]">{error}</p>
      )}
    </div>
  );
}
