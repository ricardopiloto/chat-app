// Edit mode for the channel's one scene. It replaces the composition view: numbered seats on the left,
// a side panel (seat count, layout, bench) on the right. Everything happens on a draft; Save writes it,
// Discard drops it, and closing with changes pending asks first (Cancel / Discard / Save).
import { For, Show, createMemo, createSignal } from "solid-js";
import { Badge, Button, Dialog, Icon } from "../components/ui";
import { errorText } from "../lib/errors";
import { t } from "../i18n";
import type { LayoutKey } from "../api";
import { layoutClass } from "./CompositionView";
import { useCallPeople } from "./people";
import { LAYOUTS, MAX_SEATS, MIN_SEATS, assign, bench, clampSeats, isDirty, occupied, release, resize, seatOf, seatsToDrop, setLayout, type Scene } from "./scene";
import { seatTone } from "./tiles";

export function SceneEditor(props: { saved: Scene; name: string; onSave: (scene: Scene) => Promise<void>; onClose: () => void }) {
  const { people, byId } = useCallPeople();
  const [draft, setDraft] = createSignal<Scene>(props.saved);
  const [picked, setPicked] = createSignal<string | null>(null);
  const [overSeat, setOverSeat] = createSignal<number | null>(null);
  const [saving, setSaving] = createSignal(false);
  const [problem, setProblem] = createSignal("");
  const [confirmingClose, setConfirmingClose] = createSignal(false);
  /** Set while the admin must choose which occupied seats to remove before the count shrinks. */
  const [shrinking, setShrinking] = createSignal<{ count: number; remove: number[] } | null>(null);

  const dirty = createMemo(() => isDirty(props.saved, draft()));
  const present = () => people().map((p) => p.id);
  const benched = () => bench(draft(), present());

  const place = (index: number, accountId: string) => {
    setDraft(assign(draft(), index, accountId));
    setPicked(null);
  };

  function onSeat(index: number) {
    const current = draft().seats[index];
    if (picked()) return place(index, picked()!);
    if (current?.accountId) setDraft(release(draft(), index));
  }

  function onSeatDrop(event: DragEvent, index: number) {
    event.preventDefault();
    setOverSeat(null);
    const id = event.dataTransfer?.getData("text/plain");
    if (id) place(index, id);
  }

  function changeCount(raw: number) {
    const count = clampSeats(raw);
    if (count === draft().seats.length) return;
    if (seatsToDrop(draft(), count) > 0) {
      // Pre-select the highest occupied seats; the admin can change the choice in the dialog.
      const tail = occupied(draft()).map((s) => s.index).slice(-seatsToDrop(draft(), count));
      setShrinking({ count, remove: tail });
      return;
    }
    setDraft(resize(draft(), count));
  }

  function toggleRemoval(index: number) {
    const s = shrinking();
    if (!s) return;
    const has = s.remove.includes(index);
    setShrinking({ ...s, remove: has ? s.remove.filter((i) => i !== index) : [...s.remove, index] });
  }

  const mustRemove = () => (shrinking() ? seatsToDrop(draft(), shrinking()!.count) : 0);
  const chosenOk = () => (shrinking() ? shrinking()!.remove.length === mustRemove() : false);

  function confirmShrink() {
    const s = shrinking();
    if (!s || !chosenOk()) return;
    // `resize` removes the chosen seats, then empty seats, so only the chosen people lose a seat.
    setDraft(resize(draft(), s.count, s.remove));
    setShrinking(null);
  }

  async function save() {
    setSaving(true);
    setProblem("");
    try {
      await props.onSave(draft());
      props.onClose();
    } catch (error) {
      setProblem(errorText(error));
    } finally {
      setSaving(false);
      setConfirmingClose(false);
    }
  }

  const LAYOUT_LABEL: Record<LayoutKey, string> = { mestre: t("call.layout.mestre"), quad: t("call.layout.quad"), faixa: t("call.layout.faixa") };

  return (
    <section class="call-editor" aria-label={t("call.editor.title")}>
      <header class="call-editor-head">
        <Icon name="edit" class="text-[20px]" />
        <h2>{props.name || t("call.editor.title")}</h2>
        <Badge tone="live" mono>{t("call.editor.mode")}</Badge>
        <span class="spacer" />
        <Button variant="secondary" onClick={() => (dirty() ? setConfirmingClose(true) : props.onClose())}>{t("call.editor.discard")}</Button>
        <Button variant="primary" disabled={saving() || !dirty()} onClick={() => void save()}>{t("call.editor.save")}</Button>
      </header>
      <Show when={problem()}>
        <p class="call-editor-error" role="alert">{problem()}</p>
      </Show>

      <div class="call-editor-body">
        <div class={`call-stage editing ${layoutClass(draft())}`}>
          <For each={draft().seats}>
            {(seat) => (
              <button
                type="button"
                class="call-seat editable"
                classList={{ "is-over": overSeat() === seat.index, "is-filled": !!seat.accountId, "is-target": !!picked() }}
                onClick={() => onSeat(seat.index)}
                onDragOver={(e) => { e.preventDefault(); setOverSeat(seat.index); }}
                onDragLeave={() => setOverSeat(null)}
                onDrop={(e) => onSeatDrop(e, seat.index)}
                aria-label={t("call.editor.seatLabel", { n: seat.index + 1 })}
              >
                <span class="call-seat-number">{seat.index + 1}</span>
                <Show when={byId(seat.accountId)} fallback={<span class="call-seat-hint">{picked() ? t("call.editor.dropHere") : t("call.editor.empty")}</span>}>
                  {(person) => (
                    <span class={`call-seat-person tone-${seatTone(person().id)}`}>
                      <span class="call-bench-dot">{person().name.slice(0, 1).toUpperCase()}</span>
                      <span>{person().name}</span>
                      <Icon name="close" label={t("call.editor.toBench")} class="text-[16px]" />
                    </span>
                  )}
                </Show>
              </button>
            )}
          </For>
        </div>

        <aside class="call-editor-side">
          <section>
            <h3 class="mono-label">{t("call.editor.seats")}</h3>
            <div class="call-stepper">
              <Button variant="icon" title={t("call.editor.fewer")} disabled={draft().seats.length <= MIN_SEATS} onClick={() => changeCount(draft().seats.length - 1)}>
                <Icon name="remove" />
              </Button>
              <output aria-live="polite">{draft().seats.length}</output>
              <Button variant="icon" title={t("call.editor.more")} disabled={draft().seats.length >= MAX_SEATS} onClick={() => changeCount(draft().seats.length + 1)}>
                <Icon name="add" />
              </Button>
            </div>
          </section>

          <section>
            <h3 class="mono-label">{t("call.editor.layouts")}</h3>
            <div class="call-layout-list" role="radiogroup" aria-label={t("call.editor.layouts")}>
              <For each={LAYOUTS}>
                {(key) => (
                  <button type="button" role="radio" aria-checked={draft().layout === key} class="call-layout-option" onClick={() => setDraft(setLayout(draft(), key))}>
                    <span class={`call-layout-preview layout-${key} seats-${draft().seats.length}`} aria-hidden="true">
                      <For each={draft().seats}>{() => <i />}</For>
                    </span>
                    <span>{LAYOUT_LABEL[key]}</span>
                  </button>
                )}
              </For>
            </div>
          </section>

          <section>
            <h3 class="mono-label">{t("call.bench")}</h3>
            <p class="call-editor-hint">{t("call.editor.benchHint")}</p>
            <ul class="call-bench-list">
              <For each={benched()}>
                {(id) => (
                  <Show when={byId(id)}>
                    {(person) => (
                      <li>
                        <button
                          type="button"
                          draggable={true}
                          class={`call-bench-chip tone-${seatTone(person().id)}`}
                          classList={{ "is-picked": picked() === id }}
                          aria-pressed={picked() === id}
                          onDragStart={(e) => e.dataTransfer?.setData("text/plain", id)}
                          onClick={() => setPicked(picked() === id ? null : id)}
                        >
                          <span class="call-bench-dot">{person().name.slice(0, 1).toUpperCase()}</span>
                          {person().name}
                        </button>
                      </li>
                    )}
                  </Show>
                )}
              </For>
              <Show when={benched().length === 0}>
                <li class="call-editor-hint">{t("call.benchEmpty")}</li>
              </Show>
            </ul>
            <Show when={seatOf(draft(), picked() ?? "") === -1 && picked()}>
              <p class="call-editor-hint">{t("call.editor.pickSeat")}</p>
            </Show>
          </section>
        </aside>
      </div>

      <Dialog open={shrinking() !== null} title={t("call.editor.shrinkTitle")} icon="grid_view" onClose={() => setShrinking(null)}>
        <p>{t("call.editor.shrinkBody", { n: mustRemove() })}</p>
        <ul class="call-shrink-list">
          <For each={occupied(draft())}>
            {(seat) => (
              <li>
                <label>
                  <input type="checkbox" checked={shrinking()?.remove.includes(seat.index)} onChange={() => toggleRemoval(seat.index)} />
                  <span>{t("call.editor.seatLabel", { n: seat.index + 1 })} · {byId(seat.accountId)?.name ?? "?"}</span>
                </label>
              </li>
            )}
          </For>
        </ul>
        <footer class="dialog-actions call-dialog-actions">
          <Button variant="secondary" onClick={() => setShrinking(null)}>{t("call.cancel")}</Button>
          <Button variant="primary" disabled={!chosenOk()} onClick={confirmShrink}>{t("call.editor.shrinkConfirm")}</Button>
        </footer>
      </Dialog>

      <Dialog open={confirmingClose()} title={t("call.editor.unsavedTitle")} icon="warning" accent onClose={() => setConfirmingClose(false)}>
        <p>{t("call.editor.unsavedBody")}</p>
        <footer class="dialog-actions call-dialog-actions">
          <Button variant="secondary" onClick={() => setConfirmingClose(false)}>{t("call.cancel")}</Button>
          <Button variant="danger" onClick={() => { setConfirmingClose(false); props.onClose(); }}>{t("call.editor.discard")}</Button>
          <Button variant="primary" disabled={saving()} onClick={() => void save()}>{t("call.editor.save")}</Button>
        </footer>
      </Dialog>
    </section>
  );
}
