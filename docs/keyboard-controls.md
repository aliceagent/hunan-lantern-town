# Keyboard controls for /play — plan

Status: **plan only, not implemented**. Desktop-first full-keyboard exploration of 河灯小镇;
phone tap behavior is untouched (every keyboard feature is additive, nothing is removed
from the pointer path).

Goal: Jonathan can sit at a desktop, never touch the mouse, and do everything the
pointer can do: see where the clickable areas are, pick one, watch the clip, step
back along the trail, open the menu / hints / Path carousel / Add path, mute, reset.

---

## 1. Current state (what already exists)

| Piece | File | Relevant behavior |
| --- | --- | --- |
| Play page | `app/play/page.tsx` | Owns `state`, `npc`, `authoring`, `hintSignal`; no key handling of its own |
| Engine | `lib/engine.ts` | Pure. `jumpToTrailStep(manifest, state, index)` truncates the trail; `isInteractive`, `isWorldEdge`, `resolveClick` |
| Stage | `components/Stage.tsx` | Owns `playback.phase` (`still` / `loading` / `playing`); `handleRegionClick` is the single entry point for "activate a hotspot"; `HotspotLayer` only mounts while `phase === "still"` |
| HotspotLayer | `components/HotspotLayer.tsx` | Warm regions are already `role="button" tabIndex={0}` with Enter/Space activation — Tab focus works today, just invisibly (transparent stroke, no focus ring) |
| MenuFab | `components/MenuFab.tsx` | Escape closes the open menu (`keydown` listener while `open`) |
| NpcCard | `components/NpcCard.tsx` | Escape closes |
| AddPathOverlay | `components/AddPathOverlay.tsx` | Escape exits draw mode; will grow label/text inputs, so it owns its keys |

Three components already race on `document`/`window` `keydown` for Escape. The plan
consolidates *new* keys into one listener with an explicit mode model, and leaves the
existing three Escape handlers where they are (they are modal-local and correct).

---

## 2. Mode model (who owns the keyboard right now)

Exactly one mode is active; derived, not stored. Priority top to bottom:

1. **`authoring`** — Add path draw mode (`authoring === true`). The global handler
   does **nothing at all** in this mode — not even "harmless" keys. AddPathOverlay
   keeps full ownership (Escape today; digits/letters may become vertex or label
   input later). This is the "don't steal keys from draw mode" rule, enforced
   structurally rather than key-by-key.
2. **`npc`** — NpcCard open. Escape (existing) closes; Backspace/numbers ignored.
3. **`menu`** — MenuFab popover open (incl. Path view, reset confirm). Escape
   (existing) closes; new global keys ignored except the menu-toggle key itself,
   which closes it.
4. **`clip`** — `playback.phase !== "still"`. Everything locked: no number overlay,
   no selection, no Backspace. Mute (`M`) is the one exception — it targets ambient
   audio, not navigation. (HotspotLayer already unmounts during clips, so "no boxes
   while video plays" holds for free once badges live inside HotspotLayer.)
5. **`explore`** — on a still, nothing open. Full map active (table below).

Universal guard: if `event.target` is an `<input>`, `<textarea>`, or
`contenteditable`, or `event.metaKey`/`event.ctrlKey`/`event.altKey` is held, the
handler returns null. Browser shortcuts (Cmd+R, Ctrl+L…) are never shadowed.

`event.repeat` is ignored for everything except Tab (held Backspace must not machine-gun
back through the trail).

---

## 3. Key table

### v1 ship set (10 bindings — the ones to build first)

| Key(s) | Mode | Action |
| --- | --- | --- |
| `` ` `` (backtick) | explore | **Toggle the numbered-hotspot overlay** (badges on every warm region). Sticky per still; auto-clears on frame advance. `preventDefault` not needed, but IME-safe via `event.key` check |
| `1`–`9`, `0` | explore | **Select hotspot by number** (0 = 10th). Same code path as a click: `handleRegionClick(region.id)` — plays the clip or opens the NPC card. Works even when the overlay is hidden (power users), and implicitly reveals the overlay for ~1.5 s if the digit has no match (gentle feedback instead of dead input) |
| `Backspace`, `[` | explore | **Previous location**: `jumpToTrailStep(manifest, state, state.trail.length - 2)`. No-op on the start still (engine already guards). `preventDefault()` on Backspace is mandatory — otherwise some browsers navigate history and dump the player out of /play |
| `Enter` / `Space` | explore (focused hotspot) | Play / confirm the focused region — already works via HotspotLayer's `onKeyDown`; keep, and add a **visible focus ring** so it's usable |
| `Tab` / `Shift+Tab` | explore | Cycle focus through warm regions in the same order the numbers use (see §4 ordering). Native tab order — just make DOM order match badge order |
| `Escape` | any non-explore | Close the topmost thing (menu / NPC card / draw mode / number overlay — existing handlers plus overlay-off). In explore with nothing open: **opens the menu** (game convention) |
| `M` | explore, clip | Toggle mute (existing `onToggleMute`) |
| `H` | explore | Flash the hint glow (existing `hintSignal` bump). Distinct from `` ` ``: `H` is "where should I look" (2 s pulse), backtick is "give me the numbered map" (sticky) |
| `P` | explore | Open menu directly in the **Path carousel** view |
| `F` | explore | Toggle fullscreen (keydown counts as a user gesture, so `requestFullscreen` is allowed) |

Counting `1`–`0` as one binding and `Backspace`+`[` as one, that's 10 v1 bindings.

### Later niceties (not v1)

| Key(s) | Action | Why later |
| --- | --- | --- |
| Arrow keys / `WASD` | Spatial hotspot focus: from the focused region's centroid, move focus to the nearest region in that direction | Needs a direction-scoring heuristic; Tab + numbers already cover selection |
| `Q W E R T Y…` | Ordinals 11+ on stills with >10 hotspots | No current frame has >10 warm regions; add when the manifest does |
| `?` (Shift+/) | Keyboard-help overlay (cheat sheet) | Nice polish; the numbered overlay is self-teaching enough for v1 |
| `A` | Enter Add path draw mode from the keyboard | Authoring-only convenience; the menu row is fine for now |
| `R` | Open menu with the reset confirm pre-armed (never resets directly — the two-step confirm stays) | Destructive path; low keyboard value |
| Hold-`` ` `` peek | Overlay shows while held, hides on keyup, alongside the toggle | Two behaviors on one key needs tuning (hold threshold); ship toggle first |
| `-` / `=` | Ambient volume down/up | Volume is currently a fixed 0.25 |

First key action of a session also calls `onGesture()` so ambient audio unlocks for
keyboard-only visitors, same as the first tap does.

---

## 4. The numbered-hotspot overlay

Rendered **inside `HotspotLayer`** (new `numbersVisible` prop) so all existing
guarantees transfer for free:

- **Locked during playback**: `Stage` only mounts HotspotLayer while
  `playback.phase === "still"` (`components/Stage.tsx:164`), so badges can never
  appear over a playing clip. No new condition needed; add a test to pin it.
- **World-edge stills**: badges render only for `warmRegions` (regions passing
  `isInteractive`). A world-edge still has none, so no numbers appear — just the
  existing `WorldEdgeBanner`. Backspace remains the way out, which is exactly the
  affordance an end-of-world still needs.
- **Cold regions get no number**, same as they get no click.

Badge rendering: an SVG `<g>` at `polygonCentroid(region.polygon)` — a small
rounded-rect chip (amber text on `black/75`, matching the NPC name chip at
`components/HotspotLayer.tsx:138-144`) with the ordinal label. `pointer-events-none`,
`vector-effect` sizing consistent with the hint stroke. NPC regions get their
number plus a small lantern/person glyph so "this opens a card, not a clip" reads
at a glance.

**Ordering (stable + visually predictable):** reading order with row-banding —
bucket centroids into rows of ~12% frame height, sort rows top→bottom, then left→right
within a row. Pure function, deterministic for a given frame, so the same still always
shows the same numbers. Tab order and digit ordinals both come from this one function.

Overlay lifecycle: toggling is per-still; `applyClipEnd`'s frame advance clears it
(new still, new numbers — don't leave stale badges up), and entering `npc`/`menu`/
`authoring` modes hides it (visually consistent with hotspots being locked).

---

## 5. New pure module: `lib/keyboard.ts`

Pure, no DOM (same contract as `lib/engine.ts` — the docstring rule "no DOM, no
React" applies). Everything the keydown listener does is decided here so vitest can
cover it without a browser.

```ts
export type KeyboardMode = "authoring" | "npc" | "menu" | "clip" | "explore";

export type KeyAction =
  | { type: "back" }                       // Backspace, [
  | { type: "select"; ordinal: number }    // 1–9 → 1..9, 0 → 10
  | { type: "toggleNumbers" }              // `
  | { type: "toggleMute" }                 // M
  | { type: "hint" }                       // H
  | { type: "openMenu" } | { type: "closeTop" }  // Escape (mode-dependent)
  | { type: "openPath" }                   // P
  | { type: "fullscreen" };                // F

/** Priority: authoring > npc > menu > clip > explore. */
export function deriveMode(input: {
  authoring: boolean; npcOpen: boolean; menuOpen: boolean; phase: PlaybackPhase;
}): KeyboardMode;

/** null = let the browser / a local handler have it. Pure on (key, modifiers, mode). */
export function keyToAction(
  event: { key: string; metaKey: boolean; ctrlKey: boolean; altKey: boolean;
           repeat: boolean; targetIsEditable: boolean },
  mode: KeyboardMode,
): KeyAction | null;

/** Warm regions in badge/tab order (row-banded reading order, §4). */
export function orderedHotspots(manifest: Manifest, frame: Frame): Region[];

/** Region for a typed ordinal (1-based; 0 key maps to 10 before calling). Null if out of range. */
export function hotspotForOrdinal(manifest: Manifest, frame: Frame, ordinal: number): Region | null;

/** "1"…"9", "0" for 10; letters later. */
export function badgeLabel(ordinal: number): string;
```

`orderedHotspots` reuses `isInteractive` from `lib/engine.ts` and `polygonCentroid`
from `lib/svg.ts`.

The one impure piece is a small hook, `components/useKeyboardControls.ts`: mounts a
single `document` keydown listener, calls `deriveMode` + `keyToAction`, dispatches to
callbacks, and `preventDefault()`s only when an action fired (always for Backspace/
Space/Tab-handled cases). ~60 lines, no logic beyond dispatch.

---

## 6. Exact files to change

| File | Change |
| --- | --- |
| `lib/keyboard.ts` | **New.** Pure mapping module (§5) |
| `lib/__tests__/keyboard.test.ts` | **New.** Tests (§7) |
| `components/useKeyboardControls.ts` | **New.** The single keydown listener hook |
| `app/play/page.tsx` | Mount the hook. Lift MenuFab's `open`/`view` state up (page needs them for `deriveMode` and for `P` → open-in-path-view). Track `phase` via a new `onPhaseChange` from Stage. Add `numbersVisible` state (cleared on frame advance in `onAdvance`). Wire actions: `back` → `setState(jumpToTrailStep(manifest, state, state.trail.length - 2))`; `select` → forward ordinal to Stage; `openMenu`/`openPath`/`closeTop` → menu state; `toggleMute`/`hint`/`fullscreen` → existing callbacks |
| `components/Stage.tsx` | New props: `numbersVisible`, `selectSignal: {ordinal, nonce} \| null`, `onPhaseChange`. On a select signal (and `phase === "still"`), resolve via `hotspotForOrdinal` and call the existing `handleRegionClick` — keyboard selection is *literally* a click, so playback, retry/foggy, NPC, and gesture logic are all shared |
| `components/HotspotLayer.tsx` | Render badge chips for `orderedHotspots` when `numbersVisible`; render regions in that same order so Tab matches; add a visible `:focus-visible` stroke on `.hotspot-region` |
| `components/MenuFab.tsx` | Become controlled: accept `open`, `view`, `onOpenChange`, `onViewChange` from the page (its Escape listener moves into the page-level hook's `closeTop`). Reset-confirm state stays local |
| `app/globals.css` (or wherever `.hotspot-region` lives) | Focus-ring style for keyboard focus; badge chip styles if not inline |
| `components/AddPathOverlay.tsx` | **No change.** The mode model keeps the global handler silent while authoring |
| `lib/engine.ts` | **No change.** `jumpToTrailStep` already does everything "previous location" needs |

---

## 7. Tests (vitest, no browser)

New `lib/__tests__/keyboard.test.ts`, using `lib/__tests__/fixtures.ts` manifests:

**Mapping (`keyToAction` × `deriveMode`):**
- Every v1 key maps to its action in `explore`; unmapped keys → null.
- `authoring` mode: *every* key → null (including Backspace, digits, backtick).
- `clip` mode: digits, Backspace, backtick → null; `M` still → toggleMute.
- `npc` / `menu` modes: digits and Backspace → null; Escape → closeTop.
- Escape in `explore` → openMenu; in any other mode → closeTop.
- Modifier held (`metaKey`/`ctrlKey`/`altKey`) → null for all keys.
- `targetIsEditable` → null for all keys.
- `repeat: true` → null for `back` and `select`.
- `0` maps to ordinal 10; `[` and Backspace both map to `back`.
- Mode priority: authoring beats npc beats menu beats clip.

**Ordering (`orderedHotspots` / `hotspotForOrdinal` / `badgeLabel`):**
- Only interactive regions appear (cold regions and unknown-NPC regions excluded — reuses `isInteractive` semantics).
- Row-banding: two regions at similar y sort by x; clearly stacked regions sort by y.
- Deterministic: same frame twice → identical order.
- World-edge frame (fixtures have one, or build via a frame whose edges are all cold) → empty list; `hotspotForOrdinal` → null for every ordinal.
- Out-of-range ordinal (e.g. 7 on a 3-hotspot still) → null.
- `badgeLabel(1..10)` → "1"…"9","0".

**Engine jumps (extend `lib/__tests__/engine.test.ts`):**
- "Backspace semantics": after two `applyClipEnd` advances, `jumpToTrailStep(m, s, s.trail.length - 2)` lands on the previous frame and truncates the trail by one; `moves` and `visitedLocations` untouched.
- On the initial state (trail length 1), `trail.length - 2 = -1` → no-op (guard already exists; pin it as the Backspace-at-start contract).
- Repeated back-steps walk to the start still and then no-op.

No jsdom keyboard-event simulation needed for v1 — the hook is dispatch-only; if we
want it covered later, that's a `@testing-library/react` follow-up, not a blocker.

---

## 8. Acceptance criteria

1. On desktop, a full session — start → explore 5+ stills → NPC card → back-step twice → different branch → mute → Path carousel jump → reset — completes with zero pointer use.
2. `` ` `` shows numbered chips on every warm region of the current still; pressing a shown digit behaves exactly like clicking that region (clip plays / NPC card opens).
3. While a clip is loading or playing: no badges visible, digits and Backspace do nothing, `M` still mutes.
4. On a world-edge still: overlay toggle shows no numbers (banner only); Backspace still steps back.
5. Backspace never triggers browser history navigation on /play, and holding it does not skip multiple steps.
6. In Add path draw mode, no global shortcut fires; Escape still exits draw mode; any future text input in the overlay receives digits/letters normally.
7. Tab cycles warm regions in the same order as the badge numbers, with a visible focus ring; Enter/Space activates the focused region.
8. Escape: closes menu → closes NPC card → hides number overlay → (nothing open) opens the menu. One press, one effect, topmost first.
9. Phone behavior unchanged: taps, FAB, hint pulse, and layout are byte-identical paths; no keyboard UI appears without a key press.
10. `npx vitest run` green, including the new `keyboard.test.ts` and extended engine cases; `lib/keyboard.ts` imports nothing from React or the DOM.

---

## 9. Build order

1. `lib/keyboard.ts` + tests (pure, land first, no UI risk).
2. Engine test extensions for Backspace semantics.
3. HotspotLayer badges + focus ring (visual, still no key handling).
4. `useKeyboardControls` hook + page wiring + MenuFab controlled-state lift.
5. Stage `selectSignal` / `onPhaseChange` plumbing.
6. Manual desktop pass against §8; phone smoke test.
