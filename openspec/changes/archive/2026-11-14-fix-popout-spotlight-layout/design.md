# Design

## Context

`frontend/src/voice/GridView.tsx` is shared by the main window's "Grade" view and the popout (`<GridView fill />` in `CallPopoutWindow.tsx:14-21`, confirmed by reading that file). It renders either a plain unified grid (`talkers()` then `screens()`, `GridView.tsx:106-117`) or, when a screen share is spotlighted (`focused()`, `GridView.tsx:19`), a `.call-spotlight-layout` with a main stage and a side strip (`GridView.tsx:120-130`) — confirmed in the file's own header comment ("A share can be promoted to the main stage (spotlight); the cameras then move to a strip below").

One memo, `filling()` (`GridView.tsx:24`, `!!props.fill && !focused()`), currently drives two unrelated things at once:
1. Whether the plain `.call-grid` div computes and applies measured column/row sizing (`--cols`/`--rows` from `computeGridSize`, `GridView.tsx:108-113`) — correctly meaningful only for the plain-grid path, since that div is not even rendered while spotlighted.
2. Whether the outer `.call-grid-view` wrapper (`GridView.tsx:102`) carries the `is-fill` class — which `frontend/src/voice.css:247`'s selector, `.call-popout:has(> .call-grid-view.is-fill)`, depends on to give `.call-popout` `height` and `display:flex;flex-direction:column` at all. Confirmed by reading the full stylesheet: `is-fill` on `.call-grid-view` is referenced by no other rule, so this `:has()` selector is the only thing it affects.

Because `filling()` is `false` whenever `focused()` is truthy, spotlighting a share in the popout strips `is-fill` from `.call-grid-view` even though `props.fill` (the popout's own fill intent) has not changed. That breaks the flex-filling chain the `:has()` selector was providing, so `.call-popout` falls back to just its `min-height`, and `.call-spotlight-layout` — which already has `flex:1 1 auto; display:grid; grid-template-rows:minmax(0,1fr) auto` (`voice.css:87`) and would stretch correctly given a proper flex ancestor — instead shrinks to its intrinsic one-tile height, leaving the rest of `.call-popout`'s `min-height` as empty space. This matches the reported symptom exactly: a thin sliver with black space below it.

## Goals / Non-Goals

**Goals:**
- The popout window fills correctly (main stage + side strip stretch to the window) whether or not a screen share is spotlighted.
- Keep the plain grid's measured sizing logic (`computeGridSize`, the narrow/tall single-column rule) exactly as already specified, unaffected by this fix.

**Non-Goals:**
- No change to the spotlight feature's own behavior (which share can be spotlighted, the side-strip ordering, fullscreen) beyond making it fill the popout window.
- No change to the main (non-popout) window's "Grade" view, which does not use `fill` and is unaffected by either class.
- No CSS change — the existing `.call-spotlight-layout` flex/grid properties already do the right thing once given a properly filling ancestor chain.

## Decisions

### D1. Split `filling()` into two independently-named booleans instead of widening it

Keep `filling()` (or an equivalently named memo) exactly as `!!props.fill && !focused()`, used only where it already is — the plain `.call-grid`'s own `is-fill` class and its `--cols`/`--rows` style bindings (`GridView.tsx:108,111-112`) — since that logic is genuinely specific to the plain-grid render path. Add a second, separate boolean for the outer `.call-grid-view` wrapper's `is-fill` class (`GridView.tsx:102`) that depends only on `!!props.fill`, with no `focused()` check, since that class's only job (via the CSS `:has()` selector) is "is this GridView being asked to fill its container at all" — a question that does not change just because a screen got spotlighted.

*Alternative rejected:* widen the CSS `:has()` selector at `voice.css:247` to also match when a `.call-spotlight-layout` descendant is present, instead of touching `GridView.tsx`. Rejected because the actual bug is that one memo in `GridView.tsx` is answering two different questions with one boolean; fixing it at the source is more direct and leaves the CSS selector's meaning ("the thing above a filling grid-view should itself fill") intact and easy to reason about, instead of teaching that selector about an unrelated layout mode.

## Risks / Trade-offs

- [Scope] This fixes exactly the reported symptom (popout + spotlight collapsing); it does not change anything about how spotlight behaves outside the popout, or about multiple simultaneous screen shares' ordering in the side strip, which are unaffected by this bug and unchanged by this fix.
