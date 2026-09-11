import { Index, Show } from "solid-js";
import type { GridLayout } from "../api/client";
import { IconScreenShare } from "./icons/IconScreenShare";
import { t } from "../i18n";
import { cellStyle, layoutGeometry, type LayoutKey } from "./sceneLayouts";

/** 083: one Grade cell — camera or screen share. */
export type GradeTile = {
  key: string;
  kind: "camera" | "screen";
  accountId: string;
};

export function camTileKey(accountId: string): string {
  return `cam:${accountId}`;
}

export function screenTileKey(accountId: string): string {
  return `screen:${accountId}`;
}

/** cameras first, then screens (083 clarify). */
export function buildGradeTiles(cameraIds: string[], screenIds: string[]): GradeTile[] {
  const cams = cameraIds.map((accountId) => ({
    key: camTileKey(accountId),
    kind: "camera" as const,
    accountId,
  }));
  const screens = screenIds.map((accountId) => ({
    key: screenTileKey(accountId),
    kind: "screen" as const,
    accountId,
  }));
  return [...cams, ...screens];
}

/** 086: spotlight main + strip lists; null main → unified mode. */
export function splitSpotlightTiles(
  tiles: GradeTile[],
  spotlightId: string | null,
): { main: GradeTile | null; strip: GradeTile[] } {
  if (!spotlightId) return { main: null, strip: tiles };
  const main =
    tiles.find((t) => t.kind === "screen" && t.accountId === spotlightId) ?? null;
  if (!main) return { main: null, strip: tiles };
  const strip = tiles.filter((t) => t.key !== main.key);
  return { main, strip };
}

type Props = {
  grid: GridLayout;
  handles: Record<string, string>;
  attachSlot: (index: number, el: HTMLDivElement) => void;
  /** Legacy flat grade (no screen shares). */
  gradeIdentities?: string[];
  attachGrade?: (identity: string, el: HTMLDivElement) => void;
  /** 083: unified ordered tiles (cameras then screens). */
  gradeTiles?: GradeTile[];
  attachGradeTile?: (key: string, el: HTMLDivElement) => void;
  spotlightId?: string | null;
  onToggleSpotlight?: (accountId: string) => void;
};

function GradeTileView(props: {
  tile: GradeTile;
  handles: Record<string, string>;
  spot: string | null;
  onToggleSpotlight?: (accountId: string) => void;
  attachGradeTile?: (key: string, el: HTMLDivElement) => void;
  variant?: "default" | "main" | "strip";
}) {
  const isSpot = () =>
    props.tile.kind === "screen" && props.spot === props.tile.accountId;
  const handle = () => props.handles[props.tile.accountId] ?? props.tile.accountId;
  return (
    <div
      class="slot"
      classList={{
        "grade-screen-tile": props.tile.kind === "screen",
        "is-spotlight": isSpot(),
        "is-dimmed":
          !!props.spot && props.tile.kind === "screen" && !isSpot(),
        "grade-spotlight-main-slot": props.variant === "main",
        "grade-spotlight-strip-slot": props.variant === "strip",
      }}
    >
      <div class="chip grade-tile-chip">
        <Show when={props.tile.kind === "screen"} fallback={<span>{handle()}</span>}>
          <span
            class="grade-screen-chip-label"
            aria-label={t("voice.screenTileAria", { handle: handle() })}
          >
            <IconScreenShare size={14} />
            <span>{handle()}</span>
            <span class="grade-screen-chip-tag">{t("voice.screenTile")}</span>
          </span>
          <button
            type="button"
            class="grade-spotlight-btn"
            aria-pressed={isSpot()}
            aria-label={isSpot() ? t("voice.spotlightOff") : t("voice.spotlightOn")}
            title={isSpot() ? t("voice.spotlightOff") : t("voice.spotlightOn")}
            onClick={() => props.onToggleSpotlight?.(props.tile.accountId)}
          >
            {isSpot() ? "★" : "☆"}
          </button>
        </Show>
      </div>
      <div
        class="slot-media"
        ref={(el) => props.attachGradeTile?.(props.tile.key, el)}
      />
    </div>
  );
}

export default function CameraGrid(props: Props) {
  const useUnified = () => (props.gradeTiles?.length ?? 0) > 0;
  const isGrade = () => useUnified() || (props.gradeIdentities?.length ?? 0) > 0;
  const named = () =>
    layoutGeometry(props.grid.layout_key, props.grid.slot_count || props.grid.slots.length || 4);

  const tiles = () => props.gradeTiles ?? [];
  const legacyIds = () => props.gradeIdentities ?? [];
  const gradeCount = () => (useUnified() ? tiles().length : legacyIds().length);
  const gradeCols = () => Math.min(3, Math.max(1, gradeCount()));
  const gradeRows = () => Math.ceil(Math.max(1, gradeCount()) / gradeCols());
  const spot = () => props.spotlightId ?? null;
  const split = () => splitSpotlightTiles(tiles(), spot());
  const spotlightMode = () => useUnified() && split().main != null;

  return (
    <Show
      when={isGrade()}
      fallback={
        <div
          class="stage"
          style={{
            "grid-template-columns": named().cols,
            "grid-template-rows": named().rows,
          }}
        >
          <Index each={props.grid.slots}>
            {(slot) => (
              <div
                class="slot"
                style={cellStyle(
                  (props.grid.layout_key ?? "quad") as LayoutKey,
                  slot().index,
                  props.grid.slot_count || props.grid.slots.length || 4,
                )}
              >
                <div class="chip">
                  <Show when={slot().account_id} fallback={`Slot ${slot().index + 1}`}>
                    {(id) => props.handles[id()] ?? id()}
                  </Show>
                </div>
                <div class="slot-media" ref={(el) => props.attachSlot(slot().index, el)} />
              </div>
            )}
          </Index>
        </div>
      }
    >
      <Show
        when={spotlightMode()}
        fallback={
          <div
            class="stage grade-stage-unified"
            style={{
              "grid-template-columns": `repeat(${gradeCols()}, minmax(0, 1fr))`,
              "grid-template-rows": `repeat(${gradeRows()}, minmax(0, 1fr))`,
            }}
          >
            <Show
              when={useUnified()}
              fallback={
                <Index each={legacyIds()}>
                  {(id) => (
                    <div class="slot">
                      <div class="chip">{props.handles[id()] ?? id()}</div>
                      <div class="slot-media" ref={(el) => props.attachGrade?.(id(), el)} />
                    </div>
                  )}
                </Index>
              }
            >
              <Index each={tiles()}>
                {(tile) => (
                  <GradeTileView
                    tile={tile()}
                    handles={props.handles}
                    spot={spot()}
                    onToggleSpotlight={props.onToggleSpotlight}
                    attachGradeTile={props.attachGradeTile}
                  />
                )}
              </Index>
            </Show>
          </div>
        }
      >
        {(() => {
          const main = () => split().main;
          const strip = () => split().strip;
          return (
            <div class="stage grade-stage-spotlight">
              <Show when={main()}>
                {(m) => (
                  <div class="grade-spotlight-main">
                    <GradeTileView
                      tile={m()}
                      handles={props.handles}
                      spot={spot()}
                      onToggleSpotlight={props.onToggleSpotlight}
                      attachGradeTile={props.attachGradeTile}
                      variant="main"
                    />
                  </div>
                )}
              </Show>
              <Show when={strip().length > 0}>
                <div class="grade-spotlight-strip">
                  <Index each={strip()}>
                    {(tile) => (
                      <GradeTileView
                        tile={tile()}
                        handles={props.handles}
                        spot={spot()}
                        onToggleSpotlight={props.onToggleSpotlight}
                        attachGradeTile={props.attachGradeTile}
                        variant="strip"
                      />
                    )}
                  </Index>
                </div>
              </Show>
            </div>
          );
        })()}
      </Show>
    </Show>
  );
}
