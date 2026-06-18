"use client";

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { graphql } from "@/gql";

const AddChecklistItemMutation = graphql(`
  mutation AddChecklistItem($crowdfundingId: ID!, $text: String!) {
    addChecklistItem(crowdfundingId: $crowdfundingId, text: $text) {
      id
      text
      done
      position
    }
  }
`);
const ToggleChecklistItemMutation = graphql(`
  mutation ToggleChecklistItem($itemId: ID!) {
    toggleChecklistItem(itemId: $itemId) {
      id
      done
    }
  }
`);
const RemoveChecklistItemMutation = graphql(`
  mutation RemoveChecklistItem($itemId: ID!) {
    removeChecklistItem(itemId: $itemId)
  }
`);

export type ChecklistItemData = {
  id: string;
  text: string;
  done: boolean;
  position: number;
};

export function CrowdfundingChecklist({
  crowdfundingId,
  items,
  isCreator,
}: {
  crowdfundingId: string;
  items: ReadonlyArray<ChecklistItemData>;
  isCreator: boolean;
}) {
  const [text, setText] = useState("");
  const [add, { loading: adding }] = useMutation(AddChecklistItemMutation, {
    update: (cache, { data }) => {
      const item = data?.addChecklistItem;
      const cfId = cache.identify({ __typename: "Crowdfunding", id: crowdfundingId });
      if (!item || !cfId) return;
      cache.modify({
        id: cfId,
        fields: {
          checklist(existing: ReadonlyArray<{ __ref: string }> = [], { toReference }) {
            const ref = toReference(item);
            return ref ? [...existing, ref] : existing;
          },
        },
      });
    },
  });
  const [toggle] = useMutation(ToggleChecklistItemMutation);
  const [remove] = useMutation(RemoveChecklistItemMutation, {
    update: (cache, { data }, { variables }) => {
      if (!data?.removeChecklistItem || !variables) return;
      const itemId = variables.itemId;
      const cfId = cache.identify({ __typename: "Crowdfunding", id: crowdfundingId });
      if (cfId) {
        cache.modify({
          id: cfId,
          fields: {
            checklist(existing: ReadonlyArray<{ __ref: string }> = [], { readField }) {
              return existing.filter((ref) => readField("id", ref) !== itemId);
            },
          },
        });
      }
      const id = cache.identify({ __typename: "ChecklistItem", id: itemId });
      if (id) cache.evict({ id });
      cache.gc();
    },
  });

  const sorted = [...items].sort((a, b) => a.position - b.position);
  const doneCount = items.filter((i) => i.done).length;

  const onAdd = async () => {
    const t = text.trim();
    if (!t) return;
    try {
      await add({ variables: { crowdfundingId, text: t } });
      setText("");
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "추가 실패");
    }
  };

  return (
    <section className="flex flex-col gap-2 rounded-xl border border-[color:var(--rule)] bg-[color:var(--paper)] p-4">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[13px] font-semibold">보상 체크리스트</h3>
        <span className="text-[11.5px] text-[color:var(--ink-soft)]">
          {doneCount}/{items.length}
        </span>
      </div>
      {sorted.length === 0 && (
        <p className="text-[12px] text-[color:var(--ink-soft)]">아직 항목이 없습니다.</p>
      )}
      <ul className="flex flex-col gap-1">
        {sorted.map((it) => (
          <li key={it.id} className="flex items-center gap-2 text-[13px]">
            <button
              type="button"
              disabled={!isCreator}
              onClick={() =>
                isCreator &&
                void toggle({
                  variables: { itemId: it.id },
                  optimisticResponse: {
                    toggleChecklistItem: {
                      id: it.id,
                      done: !it.done,
                    },
                  },
                })
              }
              className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] transition-colors ${
                it.done
                  ? "border-transparent bg-pay text-[color:var(--pay-on)]"
                  : "border-[color:var(--rule)] text-transparent"
              } ${isCreator ? "cursor-pointer" : "cursor-default"}`}
            >
              ✓
            </button>
            <span className={it.done ? "text-[color:var(--ink-soft)] line-through" : ""}>
              {it.text}
            </span>
            {isCreator && (
              <button
                type="button"
                onClick={() => void remove({ variables: { itemId: it.id } })}
                aria-label="항목 삭제"
                className="ml-auto text-[11px] text-[color:var(--ink-soft)] transition-colors hover:text-[color:var(--danger)]"
              >
                ✕
              </button>
            )}
          </li>
        ))}
      </ul>
      {isCreator && (
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void onAdd();
              }
            }}
            placeholder="보상 항목 추가"
            className="rounded-md border border-[color:var(--rule)] bg-[color:var(--paper)] px-3 py-2 text-[13px] outline-none focus:border-[color:var(--foreground)]/40"
          />
          <button
            type="button"
            disabled={adding || !text.trim()}
            onClick={onAdd}
            className="rounded-full bg-pay px-4 py-2 text-[13px] font-semibold text-[color:var(--pay-on)] transition-[filter] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-40"
          >
            추가
          </button>
        </div>
      )}
    </section>
  );
}
