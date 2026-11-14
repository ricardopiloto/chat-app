# Tasks

## 1. Fix the layout

- [x] 1.1 In `frontend/src/voice/GridView.tsx`, add a boolean for the outer `.call-grid-view` wrapper's `is-fill` class that depends only on `!!props.fill` (not on `focused()`), and use it at line 102 instead of `filling()`. Leave `filling()` itself, and its use on the plain `.call-grid` div and its `--cols`/`--rows` bindings (lines 108, 111-112), exactly as they are. Verify with `npm run build` (type-check) that this compiles.
- [x] 1.2 Verify manually: open the popout with a call that has at least one screen share active (and at least one other participant), spotlight the share, and confirm the main stage and side strip fill the popout window with no empty space below, at a few different window sizes. Then remove the spotlight and confirm the plain grid still fills the window as before (no regression to the already-specified equal-space-division behavior).

## 2. Spec validation

- [x] 2.1 Run `openspec validate fix-popout-spotlight-layout --strict` and confirm it passes with no errors.
