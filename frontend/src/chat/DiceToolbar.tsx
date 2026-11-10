import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { auth } from "../api";
import { Icon } from "../components/ui";
import { t } from "../i18n";
import { errorText } from "../lib/errors";

export const DICE_TOOLBAR_SIDES = [4, 6, 8, 10, 12, 20, 100] as const;
const MAX_COUNT = 20;

function emptyCounts(): Record<number, number> {
  return Object.fromEntries(DICE_TOOLBAR_SIDES.map((side) => [side, 1]));
}

export function DiceToolbar(props: {
  onNotationChange: (notation: string) => void;
}) {
  const [visible, setVisible] = createSignal<number[]>([...DICE_TOOLBAR_SIDES]);
  const [counts, setCounts] = createSignal<Record<number, number>>(emptyCounts());
  const [active, setActive] = createSignal<number>(20);
  const [configOpen, setConfigOpen] = createSignal(false);
  const [menuStyle, setMenuStyle] = createSignal<JSX.CSSProperties>({});
  const [problem, setProblem] = createSignal("");
  const [saving, setSaving] = createSignal(false);
  let gearRef: HTMLButtonElement | undefined;
  let menuRef: HTMLDivElement | undefined;

  onMount(() => {
    void (async () => {
      try {
        const pref = await auth.getDiceToolbar();
        setVisible(pref.visible_sides.filter((side) => (DICE_TOOLBAR_SIDES as readonly number[]).includes(side)));
        if (pref.visible_sides.length > 0) {
          const first = pref.visible_sides[0]!;
          setActive(first);
          props.onNotationChange(`${counts()[first] ?? 1}d${first}`);
        }
      } catch (error) {
        setProblem(errorText(error));
      }
    })();
  });

  function placeMenu() {
    if (!gearRef) return;
    const rect = gearRef.getBoundingClientRect();
    const menuWidth = Math.min(188, window.innerWidth - 16);
    const left = Math.max(8, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8));
    const spaceAbove = rect.top;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openAbove = spaceAbove >= 200 || spaceAbove >= spaceBelow;
    if (openAbove) {
      setMenuStyle({
        position: "fixed",
        left: `${left}px`,
        bottom: `${window.innerHeight - rect.top + 6}px`,
        width: `${menuWidth}px`,
        zIndex: 2400,
      });
    } else {
      setMenuStyle({
        position: "fixed",
        left: `${left}px`,
        top: `${rect.bottom + 6}px`,
        width: `${menuWidth}px`,
        zIndex: 2400,
      });
    }
  }

  createEffect(() => {
    if (!configOpen()) return;
    placeMenu();
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node;
      if (gearRef?.contains(target) || menuRef?.contains(target)) return;
      setConfigOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setConfigOpen(false);
    };
    const onReposition = () => placeMenu();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", onReposition);
    window.addEventListener("scroll", onReposition, true);
    onCleanup(() => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onReposition);
      window.removeEventListener("scroll", onReposition, true);
    });
  });

  const orderedVisible = createMemo(() =>
    DICE_TOOLBAR_SIDES.filter((side) => visible().includes(side)),
  );

  function applySide(side: number, count: number) {
    setActive(side);
    props.onNotationChange(`${count}d${side}`);
  }

  function bump(side: number, delta: number) {
    const next = Math.max(1, Math.min(MAX_COUNT, (counts()[side] ?? 1) + delta));
    setCounts((prev) => ({ ...prev, [side]: next }));
    applySide(side, next);
  }

  /** Left-click: first click on another face only selects it; later clicks bump count. */
  function onFaceClick(side: number) {
    if (active() !== side) {
      applySide(side, counts()[side] ?? 1);
      return;
    }
    bump(side, 1);
  }

  async function toggleSide(side: number, checked: boolean) {
    const order = DICE_TOOLBAR_SIDES as readonly number[];
    const next = checked
      ? [...new Set([...visible(), side])].sort((a, b) => order.indexOf(a) - order.indexOf(b))
      : visible().filter((value) => value !== side);
    const previous = visible();
    setVisible(next);
    setSaving(true);
    setProblem("");
    try {
      const saved = await auth.putDiceToolbar(next);
      setVisible(saved.visible_sides);
      if (!saved.visible_sides.includes(active()) && saved.visible_sides[0] != null) {
        const nextActive = saved.visible_sides[0];
        applySide(nextActive, counts()[nextActive] ?? 1);
      }
    } catch (error) {
      setVisible(previous);
      setProblem(errorText(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div class="ch-dice-toolbar" role="toolbar" aria-label={t("txt.dice.toolbar")}>
      <div class="ch-dice-toolbar-strip">
        <For each={orderedVisible()}>
          {(side) => (
            <div class="ch-dice-tool" classList={{ "is-active": active() === side }}>
              <button
                type="button"
                class="ch-dice-tool-face"
                aria-label={t("txt.dice.toolbarDie", { sides: String(side), count: String(counts()[side] ?? 1) })}
                aria-pressed={active() === side}
                onClick={() => onFaceClick(side)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  bump(side, -1);
                }}
              >
                <span class="ch-dice-tool-label">d{side}</span>
                <span class="ch-dice-tool-count">{counts()[side] ?? 1}</span>
              </button>
              <div class="ch-dice-tool-steppers">
                <button type="button" class="ch-dice-tool-step" aria-label={t("txt.dice.toolbarDec")} onClick={() => bump(side, -1)}>−</button>
                <button type="button" class="ch-dice-tool-step" aria-label={t("txt.dice.toolbarInc")} onClick={() => bump(side, 1)}>+</button>
              </div>
            </div>
          )}
        </For>
      </div>
      <div class="ch-dice-toolbar-config">
        <button
          ref={(el) => { gearRef = el; }}
          type="button"
          class="ch-dice-toolbar-gear"
          aria-expanded={configOpen()}
          aria-haspopup="true"
          aria-label={t("txt.dice.toolbarConfig")}
          title={t("txt.dice.toolbarConfig")}
          onClick={() => setConfigOpen((open) => !open)}
        >
          <Icon name="tune" />
        </button>
        <Show when={configOpen()}>
          <div
            ref={(el) => { menuRef = el; }}
            class="ch-dice-toolbar-checklist"
            style={menuStyle()}
            role="group"
            aria-label={t("txt.dice.toolbarConfig")}
          >
            <For each={[...DICE_TOOLBAR_SIDES]}>
              {(side) => (
                <label class="ch-dice-toolbar-check">
                  <input
                    type="checkbox"
                    checked={visible().includes(side)}
                    disabled={saving()}
                    onChange={(event) => void toggleSide(side, event.currentTarget.checked)}
                  />
                  <span>d{side}</span>
                </label>
              )}
            </For>
          </div>
        </Show>
      </div>
      <Show when={problem()}><p class="ch-problem" role="alert">{problem()}</p></Show>
    </div>
  );
}
