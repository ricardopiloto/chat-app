# Proposal

## Why

In the desktop popout window (a separate OS window showing only a call's video grid, `frontend/src/voice/CallPopoutWindow.tsx`), promoting ("spotlighting") a shared screen to the main stage breaks the layout: it collapses to a thin sliver just tall enough for one tile, with empty black space filling the rest of the window, instead of the main stage and side strip filling the window the way the plain grid already does.

## What Changes

- Fix `frontend/src/voice/GridView.tsx`: the `is-fill` class on the outer `.call-grid-view` wrapper currently depends on `filling()`, which is `false` whenever a screen is spotlighted (`!!props.fill && !focused()`, `GridView.tsx:24`). That class is what the popout's CSS `:has()` selector (`frontend/src/voice.css:247`, `.call-popout:has(> .call-grid-view.is-fill)`) depends on to make the popout window fill and stretch its content. Spotlighting a share incorrectly strips that class even though the popout's own fill intent has not changed, which breaks the chain of flex containers down to `.call-spotlight-layout` and collapses it to its intrinsic content height.
- Decouple the two unrelated concerns `filling()` currently conflates: whether this `GridView` is rendered in a fill/popout context at all (should stay true regardless of spotlight state, and should keep driving the outer wrapper's `is-fill` class) versus whether the plain unified grid should compute and apply its own measured column/row sizing (only meaningful for the plain-grid render path, which does not even render while a screen is spotlighted).
- No CSS change is needed: `.call-spotlight-layout` (`voice.css:87`) already has the flex/grid properties needed to stretch correctly once its ancestor chain up to `.call-popout` is a proper filling flex container again.

## Capabilities

### Modified Capabilities

- `frontend-v2/call-popout`: the "equal space division" requirement's scope, which today explicitly excludes the case where a screen share is spotlighted, is extended so the popout also fills the window correctly in that case.

## Impact

- `frontend/src/voice/GridView.tsx` (around line 24 and line 102).
- No CSS change, no backend impact.
