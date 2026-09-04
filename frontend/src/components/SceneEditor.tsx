import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import type { GridLayout } from "../api/client";
import {
  assignAccount,
  bankAccountIds,
  createDraft,
  discardDraft,
  isDirty,
  markSaved,
  returnToBank,
  setNamedLayout,
  type SceneDraft,
} from "../preferences/sceneDraft";
import { ConfirmDirty } from "./Dialog";
import { LAYOUT_KEYS, cellStyle, layoutOf, type LayoutKey } from "./sceneLayouts";

type Props = {
  channelId: string;
  sceneId: string;
  sceneName: string;
  sceneIsActive: boolean;
  layout: GridLayout;
  handles: Record<string, string>;
  inCallIds: string[];
  onSave: (layout: GridLayout) => Promise<void>;
  onClose: () => void;
};

export default function SceneEditor(props: Props) {
  const [draft, setDraft] = createSignal<SceneDraft>(
    createDraft(props.sceneId, props.channelId, props.layout, props.sceneName),
  );
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [confirmExit, setConfirmExit] = createSignal(false);
  const [selectedBank, setSelectedBank] = createSignal<string | null>(null);

  createEffect(() => {
    setDraft(createDraft(props.sceneId, props.channelId, props.layout, props.sceneName));
  });

  const bank = () => bankAccountIds(draft(), props.inCallIds);
  const named = () => layoutOf(draft().draftLayout.layout_key);

  async function save() {
    setBusy(true);
    setError("");
    try {
      await props.onSave(draft().draftLayout);
      setDraft(markSaved(draft()));
      setConfirmExit(false);
      props.onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }

  function discard() {
    setDraft(discardDraft(draft()));
    setConfirmExit(false);
    props.onClose();
  }

  function requestClose() {
    if (isDirty(draft())) setConfirmExit(true);
    else props.onClose();
  }

  function onSlotActivate(slotIndex: number) {
    const sel = selectedBank();
    if (sel) {
      setDraft(assignAccount(draft(), sel, slotIndex));
      setSelectedBank(null);
      return;
    }
    const slot = draft().draftLayout.slots.find((s) => s.index === slotIndex);
    if (slot?.account_id) setDraft(returnToBank(draft(), slot.account_id));
  }

  createEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  return (
    <section class="scene-editor scene-editor-stack">
      <div class="scene-editor-toolbar">
        <strong>Editar: {props.sceneName}</strong>
        <span class="muted" style={{ "margin-left": "auto" }}>
          Toque: banco → slot · slot ocupado devolve
        </span>
        <button type="button" class="btn btn-secondary" onClick={requestClose} disabled={busy()}>
          Descartar
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onClick={() => void save()}
          disabled={busy() || !isDirty(draft())}
        >
          Salvar cena
        </button>
      </div>

      <div
        class="editor-stage"
        style={{
          "grid-template-columns": named().cols,
          "grid-template-rows": named().rows,
        }}
      >
        <For each={draft().draftLayout.slots}>
          {(slot) => (
            <div
              class="editor-slot"
              style={cellStyle(draft().draftLayout.layout_key as LayoutKey, slot.index)}
              onClick={() => onSlotActivate(slot.index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer?.getData("text/account-id");
                if (id) setDraft(assignAccount(draft(), id, slot.index));
              }}
            >
              <span class="muted" style={{ "font-size": "11px" }}>
                Slot {slot.index + 1}
              </span>
              <Show when={slot.account_id} fallback={<span class="muted">vazio</span>}>
                {(id) => <strong>{props.handles[id()] ?? id()}</strong>}
              </Show>
            </div>
          )}
        </For>
      </div>

      <div class="scene-editor-side">
        <div class="sidebar-section" style={{ padding: "0 0 8px" }}>
          Layout da cena
        </div>
        <div class="layout-list">
          <For each={LAYOUT_KEYS}>
            {(key) => {
              const L = () => layoutOf(key);
              const active = () => draft().draftLayout.layout_key === key;
              return (
                <button
                  type="button"
                  class={`layout-option${active() ? " active" : ""}`}
                  onClick={() => setDraft(setNamedLayout(draft(), key))}
                >
                  <span
                    class="layout-thumb"
                    style={{
                      "grid-template-columns": L().cols,
                      "grid-template-rows": L().rows,
                    }}
                  >
                    <For each={L().cells}>
                      {(c) => (
                        <span
                          style={{
                            "grid-column": c.col,
                            "grid-row": c.row,
                            background: "var(--tile)",
                            "border-radius": "2px",
                          }}
                        />
                      )}
                    </For>
                  </span>
                  <span>{L().label}</span>
                  <span class="muted" style={{ "margin-left": "auto" }}>
                    {L().slotCount}
                  </span>
                </button>
              );
            }}
          </For>
        </div>

        <div class="sidebar-section" style={{ padding: "16px 0 8px" }}>
          No banco
        </div>
        <div class="editor-bank">
          <For each={bank()}>
            {(id) => (
              <button
                type="button"
                class="bank-token"
                draggable
                onDragStart={(e) => e.dataTransfer?.setData("text/account-id", id)}
                onClick={() => setSelectedBank(selectedBank() === id ? null : id)}
                style={
                  selectedBank() === id
                    ? { outline: "2px solid var(--color-accent)" }
                    : undefined
                }
              >
                {props.handles[id] ?? id.slice(0, 8)}
              </button>
            )}
          </For>
          <Show when={bank().length === 0}>
            <span class="muted">Ninguém na chamada sem slot</span>
          </Show>
        </div>
      </div>

      <p class="error">{error()}</p>
      <ConfirmDirty
        open={confirmExit()}
        onCancel={() => setConfirmExit(false)}
        onDiscard={discard}
        onSave={() => void save()}
      />
    </section>
  );
}
