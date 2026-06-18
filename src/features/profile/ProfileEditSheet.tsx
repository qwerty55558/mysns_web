"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";
import { SheetShell } from "@/features/wallet/SheetShell";
import { uploadImage, toAbsoluteMediaUrl } from "@/lib/upload";

const UpdateMeProfileMutation = graphql(`
  mutation UpdateMeProfile($input: UpdateMeInput!) {
    updateMe(input: $input) {
      id
      displayName
      bio
      avatarUrl
    }
  }
`);

type Props = {
  user: {
    id: string;
    displayName: string;
    bio: string | null;
    avatarUrl: string | null;
  };
  onClose: () => void;
};

export function ProfileEditSheet({ user, onClose }: Props) {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [bio, setBio] = useState(user.bio ?? "");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(user.avatarUrl);
  // 업로드 완료를 기다리지 않고 선택 즉시 미리보기 (브라우저 메모리의 object URL)
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [updateMe, { loading: saving }] = useMutation(UpdateMeProfileMutation);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = "";
    if (!file) return;
    setError(null);
    setPreview(URL.createObjectURL(file)); // 즉시 미리보기
    setUploading(true);
    try {
      const r = await uploadImage(file);
      setAvatarUrl(r.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "업로드 실패");
      setPreview(null); // 업로드 실패 시 미리보기 원복
    } finally {
      setUploading(false);
    }
  };

  const name = displayName.trim();
  const canSave = name.length > 0 && !saving && !uploading;

  // 미리보기(로컬 blob)가 있으면 그걸, 없으면 저장된 아바타를 보여준다
  const shownAvatar = preview ?? (avatarUrl ? toAbsoluteMediaUrl(avatarUrl) : null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSave) return;
    setError(null);
    try {
      await updateMe({
        variables: {
          // BE 계약: null = 변경 안 함, "" = 값 비우기(clear). 그래서 제거/비우기는
          // null 이 아니라 "" 로 보내야 실제로 반영된다.
          input: { displayName: name, bio: bio.trim(), avatarUrl: avatarUrl ?? "" },
        },
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장 실패");
    }
  };

  return (
    <SheetShell title="프로필 편집" onClose={onClose}>
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex items-center gap-4">
          <span className="bg-pay-gradient inline-flex h-20 w-20 shrink-0 items-center justify-center rounded-full p-[3px]">
            <span className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-[color:var(--paper)] text-[22px] font-semibold">
              {shownAvatar ? (
                <Image
                  src={shownAvatar}
                  alt=""
                  width={80}
                  height={80}
                  unoptimized
                  className="h-full w-full object-cover"
                />
              ) : (
                name.charAt(0).toUpperCase() || "?"
              )}
            </span>
          </span>
          <div className="flex flex-col gap-1.5">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="rounded-full border border-[color:var(--rule)] px-3.5 py-1.5 text-[12.5px] font-medium transition-colors hover:border-[color:var(--pay)]/50 disabled:opacity-50"
            >
              {uploading ? "업로드 중…" : "사진 변경"}
            </button>
            {shownAvatar && (
              <button
                type="button"
                onClick={() => {
                  setPreview(null);
                  setAvatarUrl(null);
                }}
                className="text-left text-[11.5px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--danger)]"
              >
                사진 제거
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            hidden
            onChange={onPickFile}
          />
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">표시 이름</span>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={40}
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[14px] focus:border-[color:var(--foreground)]/40 focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11.5px] text-[color:var(--ink-soft)]">소개</span>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            maxLength={160}
            className="resize-none rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[14px] focus:border-[color:var(--foreground)]/40 focus:outline-none"
          />
          <span className="self-end text-[11px] text-[color:var(--ink-soft)]">
            {bio.length}/160
          </span>
        </label>

        {error && (
          <p className="text-[11.5px] text-[color:var(--danger)]">{error}</p>
        )}

        <button
          type="submit"
          disabled={!canSave}
          className="w-full rounded-full bg-pay py-3 text-[14px] font-semibold text-[color:var(--pay-on)] shadow-[0_8px_22px_-12px_rgba(3,199,90,0.8)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </form>
    </SheetShell>
  );
}
