import type { GridLayout } from "../api/client";
import {
  MAX_SCENE_SLOTS,
  MIN_SCENE_SLOTS,
  type LayoutKey,
} from "../components/sceneLayouts";

export type SceneDraft = {
  sceneId: string;
  channelId: string;
  baseLayout: GridLayout;
  draftLayout: GridLayout;
  nameDraft: string | null;
};

export type SetSlotCountResult =
  | { ok: true; draft: SceneDraft }
  | { ok: false; needsChoice: true; delta: number; currentN: number; targetN: number };

function cloneLayout(layout: GridLayout): GridLayout {
  return {
    layout_key: layout.layout_key ?? "quad",
    slot_count: layout.slot_count,
    assigned_by: layout.assigned_by,
    slots: layout.slots.map((s) => ({ index: s.index, account_id: s.account_id })),
  };
}

function clampN(n: number): number {
  return Math.min(MAX_SCENE_SLOTS, Math.max(MIN_SCENE_SLOTS, Math.floor(n)));
}

function reindexSlots(
  kept: { index: number; account_id: string | null }[],
): { index: number; account_id: string | null }[] {
  const ordered = [...kept].sort((a, b) => a.index - b.index);
  return ordered.map((s, index) => ({ index, account_id: s.account_id }));
}

export function layoutsEqual(a: GridLayout, b: GridLayout): boolean {
  if ((a.layout_key ?? "quad") !== (b.layout_key ?? "quad")) return false;
  if (a.slot_count !== b.slot_count) return false;
  if (a.slots.length !== b.slots.length) return false;
  for (let i = 0; i < a.slots.length; i++) {
    const left = a.slots[i];
    const right = b.slots[i];
    if (!left || !right) return false;
    if (left.index !== right.index) return false;
    if (left.account_id !== right.account_id) return false;
  }
  return true;
}

export function isDirty(draft: SceneDraft): boolean {
  return !layoutsEqual(draft.baseLayout, draft.draftLayout);
}

export function createDraft(
  sceneId: string,
  channelId: string,
  layout: GridLayout,
  name: string | null = null,
): SceneDraft {
  const base = cloneLayout({
    ...layout,
    layout_key: layout.layout_key ?? "quad",
  });
  return {
    sceneId,
    channelId,
    baseLayout: base,
    draftLayout: cloneLayout(base),
    nameDraft: name,
  };
}

export function discardDraft(draft: SceneDraft): SceneDraft {
  return {
    ...draft,
    draftLayout: cloneLayout(draft.baseLayout),
  };
}

export function markSaved(draft: SceneDraft): SceneDraft {
  const next = cloneLayout(draft.draftLayout);
  return {
    ...draft,
    baseLayout: next,
    draftLayout: cloneLayout(next),
  };
}

export function setNamedLayout(draft: SceneDraft, key: LayoutKey): SceneDraft {
  const n = clampN(draft.draftLayout.slot_count || 4);
  const slots = Array.from({ length: n }, (_, index) => {
    const prev = draft.draftLayout.slots.find((s) => s.index === index);
    return { index, account_id: prev?.account_id ?? null };
  });
  const seen = new Set<string>();
  for (const s of slots) {
    if (s.account_id) {
      if (seen.has(s.account_id)) s.account_id = null;
      else seen.add(s.account_id);
    }
  }
  return {
    ...draft,
    draftLayout: {
      layout_key: key,
      slot_count: n,
      assigned_by: "owner",
      slots,
    },
  };
}

/** Apply a new slot count. If occupied slots must be removed, returns needsChoice. */
export function trySetSlotCount(draft: SceneDraft, rawN: number): SetSlotCountResult {
  const targetN = clampN(rawN);
  const current = [...draft.draftLayout.slots].sort((a, b) => a.index - b.index);
  const currentN = current.length;
  if (targetN === currentN && draft.draftLayout.slot_count === targetN) {
    return { ok: true, draft };
  }

  if (targetN > currentN) {
    const slots = current.map((s) => ({ ...s }));
    for (let i = currentN; i < targetN; i++) {
      slots.push({ index: i, account_id: null });
    }
    return {
      ok: true,
      draft: {
        ...draft,
        draftLayout: {
          ...draft.draftLayout,
          slot_count: targetN,
          assigned_by: "owner",
          slots,
        },
      },
    };
  }

  const delta = currentN - targetN;
  const emptyIndices = current.filter((s) => !s.account_id).map((s) => s.index);
  if (emptyIndices.length >= delta) {
    const remove = new Set(
      [...emptyIndices].sort((a, b) => b - a).slice(0, delta),
    );
    const kept = current.filter((s) => !remove.has(s.index));
    const slots = reindexSlots(kept);
    return {
      ok: true,
      draft: {
        ...draft,
        draftLayout: {
          ...draft.draftLayout,
          slot_count: targetN,
          assigned_by: "owner",
          slots,
        },
      },
    };
  }

  return {
    ok: false,
    needsChoice: true,
    delta,
    currentN,
    targetN,
  };
}

/** After user picks indices to remove when decreasing N with occupied overflow. */
export function applySlotRemoval(
  draft: SceneDraft,
  removeIndices: number[],
  targetN: number,
): SceneDraft {
  const n = clampN(targetN);
  const remove = new Set(removeIndices);
  if (remove.size !== draft.draftLayout.slots.length - n) {
    return draft;
  }
  const kept = draft.draftLayout.slots.filter((s) => !remove.has(s.index));
  if (kept.length !== n) return draft;
  return {
    ...draft,
    draftLayout: {
      ...draft.draftLayout,
      slot_count: n,
      assigned_by: "owner",
      slots: reindexSlots(kept),
    },
  };
}

export function assignAccount(
  draft: SceneDraft,
  accountId: string | null,
  slotIndex: number,
): SceneDraft {
  const slots = draft.draftLayout.slots.map((s) => {
    if (s.index === slotIndex) return { ...s, account_id: accountId };
    if (accountId && s.account_id === accountId) return { ...s, account_id: null };
    return { ...s };
  });
  return {
    ...draft,
    draftLayout: { ...draft.draftLayout, assigned_by: "owner", slots },
  };
}

export function returnToBank(draft: SceneDraft, accountId: string): SceneDraft {
  const slots = draft.draftLayout.slots.map((s) =>
    s.account_id === accountId ? { ...s, account_id: null } : s,
  );
  return {
    ...draft,
    draftLayout: { ...draft.draftLayout, slots },
  };
}

export function bankAccountIds(draft: SceneDraft, inCall: string[]): string[] {
  const slotted = new Set(
    draft.draftLayout.slots.map((s) => s.account_id).filter((id): id is string => !!id),
  );
  return inCall.filter((id) => !slotted.has(id));
}
