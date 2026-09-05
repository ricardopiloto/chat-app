import { For, Show, createEffect, createSignal, onCleanup } from "solid-js";
import type { GridLayout } from "../api/client";
import {
  applySlotRemoval,
  assignAccount,
  bankAccountIds,
  createDraft,
  discardDraft,
  isDirty,
  markSaved,
  returnToBank,
  setNamedLayout,
  trySetSlotCount,
  type SceneDraft,
} from "../preferences/sceneDraft";
import { ConfirmDirty } from "./Dialog";
import {
  LAYOUT_KEYS,
  MAX_SCENE_SLOTS,
  MIN_SCENE_SLOTS,
  cellStyle,
  familyLabel,
  layoutGeometry,
  type LayoutKey,
} from "./sceneLayouts";

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

type ReducePrompt = {
  targetN: number;
  delta: number;
  selected: Set<number>;
};

export default function SceneEditor(props: Props) {
  const [draft, setDraft] = createSignal<SceneDraft>(
    createDraft(props.sceneId, props.channelId, props.layout, props.sceneName),
  );
  const [error, setError] = createSignal("");
  const [busy, setBusy] = createSignal(false);
  const [confirmExit, setConfirmExit] = createSignal(false);
  const [selectedBank, setSelectedBank] = createSignal<string | null>(null);
  const [reducePrompt, setReducePrompt] = createSignal<ReducePrompt | null>(null);

  createEffect(() => {
    setDraft(createDraft(props.sceneId, props.channelId, props.layout, props.sceneName));
    setReducePrompt(null);
  });

  const bank = () => bankAccountIds(draft(), props.inCallIds);
  const n = () => draft().draftLayout.slot_count || draft().draftLayout.slots.length || 4;
  const geo = () =>
    layoutGeometry(draft().draftLayout.layout_key as LayoutKey, n());

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
    setReducePrompt(null);
    setConfirmExit(false);
    props.onClose();
  }

  function requestClose() {
    if (isDirty(draft())) setConfirmExit(true);
    else props.onClose();
  }

  function onSlotActivate(slotIndex: number) {
    const prompt = reducePrompt();
    if (prompt) {
      const next = new Set(prompt.selected);
      if (next.has(slotIndex)) next.delete(slotIndex);
      else if (next.size < prompt.delta) next.add(slotIndex);
      setReducePrompt({ ...prompt, selected: next });
      return;
    }
    const sel = selectedBank();
    if (sel) {
      setDraft(assignAccount(draft(), sel, slotIndex));
      setSelectedBank(null);
      return;
    }
    const slot = draft().draftLayout.slots.find((s) => s.index === slotIndex);
    if (slot?.account_id) setDraft(returnToBank(draft(), slot.account_id));
  }

  function onChangeN(raw: string) {
    const target = Number(raw);
    if (!Number.isFinite(target)) return;
    const result = trySetSlotCount(draft(), target);
    if (result.ok) {
      setDraft(result.draft);
      setReducePrompt(null);
      return;
    }
    setReducePrompt({
      targetN: result.targetN,
      delta: result.delta,
      selected: new Set(),
    });
  }

  function confirmReduce() {
    const prompt = reducePrompt();
    if (!prompt || prompt.selected.size !== prompt.delta) return;
    setDraft(applySlotRemoval(draft(), [...prompt.selected], prompt.targetN));
    setReducePrompt(null);
  }

  function cancelReduce() {
    setReducePrompt(null);
  }

  createEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        if (reducePrompt()) {
          cancelReduce();
          return;
        }
        requestClose();
      }
    };
    window.addEventListener("keydown", onKey);
    onCleanup(() => window.removeEventListener("keydown", onKey));
  });

  const slotChoices = Array.from(
    { length: MAX_SCENE_SLOTS - MIN_SCENE_SLOTS + 1 },
    (_, i) => MIN_SCENE_SLOTS + i,
  );

  return (
    <section class="scene-editor">
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
          disabled={busy() || !isDirty(draft()) || !!reducePrompt()}
        >
          Salvar cena
        </button>
      </div>

      <Show when={reducePrompt()}>
        {(p) => (
          <div class="scene-reduce-banner" role="status">
            <p>
              Escolha <strong>{p().delta}</strong> slot(s) a remover para ficar com{" "}
              {p().targetN} câmeras ({p().selected.size}/{p().delta} seleccionados).
            </p>
            <div class="row" style={{ gap: "8px" }}>
              <button type="button" class="btn btn-secondary" onClick={cancelReduce}>
                Cancelar
              </button>
              <button
                type="button"
                class="btn btn-primary"
                disabled={p().selected.size !== p().delta}
                onClick={confirmReduce}
              >
                Remover seleccionados
              </button>
            </div>
          </div>
        )}
      </Show>

      <div class="scene-editor-body">
        <div
          class="editor-stage"
          style={{
            "grid-template-columns": geo().cols,
            "grid-template-rows": geo().rows,
          }}
        >
          <For each={draft().draftLayout.slots}>
            {(slot) => {
              const marked = () => reducePrompt()?.selected.has(slot.index) ?? false;
              return (
                <div
                  class={`editor-slot${marked() ? " editor-slot-remove" : ""}`}
                  style={cellStyle(
                    draft().draftLayout.layout_key as LayoutKey,
                    slot.index,
                    n(),
                  )}
                  onClick={() => onSlotActivate(slot.index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (reducePrompt()) return;
                    const id = e.dataTransfer?.getData("text/account-id");
                    if (id) setDraft(assignAccount(draft(), id, slot.index));
                  }}
                >
                  <span class="muted" style={{ "font-size": "11px" }}>
                    Slot {slot.index + 1}
                    {slot.index === 0 &&
                    draft().draftLayout.layout_key === "mestre"
                      ? " · destaque"
                      : ""}
                  </span>
                  <Show when={slot.account_id} fallback={<span class="muted">vazio</span>}>
                    {(id) => <strong>{props.handles[id()] ?? id()}</strong>}
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <div class="scene-editor-side">
          <div class="sidebar-section" style={{ padding: "0 0 8px" }}>
            Câmeras na cena
          </div>
          <label class="field" style={{ "margin-bottom": "12px" }}>
            <span class="muted" style={{ "font-size": "12px" }}>
              Número de slots ({MIN_SCENE_SLOTS}–{MAX_SCENE_SLOTS})
            </span>
            <select
              class="input"
              value={String(n())}
              disabled={!!reducePrompt()}
              onChange={(e) => onChangeN(e.currentTarget.value)}
            >
              <For each={slotChoices}>{(v) => <option value={String(v)}>{v}</option>}</For>
            </select>
          </label>

          <div class="sidebar-section" style={{ padding: "0 0 8px" }}>
            Layout da cena
          </div>
          <div class="layout-list">
            <For each={LAYOUT_KEYS}>
              {(key) => {
                const L = () => layoutGeometry(key, n());
                const active = () => draft().draftLayout.layout_key === key;
                return (
                  <button
                    type="button"
                    class={`layout-option${active() ? " active" : ""}`}
                    disabled={!!reducePrompt()}
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
                    <span>{familyLabel(key, n())}</span>
                    <span class="muted" style={{ "margin-left": "auto" }}>
                      {n()}
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
                  disabled={!!reducePrompt()}
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
