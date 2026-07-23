# BeatForge Roadmap

BeatForge is currently a functional metronome (tempo slider, start/stop, time
signature and subdivision pickers) but the README's promise — "more than
just a tempo tool, a personalized tempo tracker" — is still mostly ahead of
us. The five features below move the app from "click generator" toward that
vision.

## 1. Practice Session History & Progress Tracker

**What:** Record every practice session (start/stop time, duration, tempo(s)
used, time signature, subdivision) and surface it as a history log and a
tempo-over-time chart, plus a simple day-streak counter.

**Why:** This is the core differentiator called out in the README. Right
now nothing persists after you close the tab.

**Notes:**
- Start with `Zustand` + its `persist` middleware to `localStorage`; no
  backend required for v1.
- A session starts on "Start" and closes on "Stop" (or after N minutes of
  inactivity); tempo changes mid-session are logged as a series so the chart
  can show ramps, not just a single BPM per session.
- History view: list of past sessions + a line chart of tempo reached per
  day/session.

## 2. Song / Exercise Preset Library

**What:** Let users save a named preset — tempo, time signature,
subdivision, accent pattern — and reload it with one click. Presets are
searchable/filterable and editable after creation.

**Why:** Drummers re-practice the same songs and exercises repeatedly;
re-entering tempo/time signature every time is friction the app should
remove.

**Notes:**
- Persisted alongside session history in the same Zustand store.
- Each history entry can optionally reference the preset it was practiced
  under, which is what makes per-song tempo progress (see #1) possible
  rather than just global progress.

## 3. Tempo Ladder (Progressive Speed Training)

**What:** A training mode where you set a start tempo, a target tempo, an
increment, and a trigger (e.g. "+2 BPM every 8 bars" or "+2 BPM every 60
seconds"). The metronome then auto-advances tempo through the session
instead of staying fixed.

**Why:** Gradually increasing tempo is a standard technique for building
speed/endurance, and it's the kind of "personalized" training the base
metronome can't do today.

**Notes:**
- Needs the scheduling loop in `Metronome.tsx` to track elapsed
  bars/seconds and mutate tempo state on its own, distinct from the manual
  slider/input.
- Ladder configs are worth saving as presets (ties into #2).

## 4. Real Accent Patterns Tied to Time Signature & Subdivision

**What:** Wire the existing (currently cosmetic) time signature and
subdivision selectors into the actual audio scheduling: accent the
downbeat, play distinct subdivision clicks, and allow a custom per-beat
pattern (accent / normal / muted) instead of one flat oscillator tone.

**Why:** Today changing "4/4" to "6/8" or "Quarter" to "Triplet" has no
audible effect — the controls are UI state only. This is the biggest gap
between what the app appears to do and what it actually does.

**Notes:**
- Replace the naive `setInterval` scheduler in `Metronome.tsx` with a
  lookahead scheduler (using `AudioContext.currentTime`) so beat timing
  doesn't drift and per-beat accent/subdivision audio can be scheduled
  precisely.
- Each beat resolves to one of: accent (louder/higher pitch), normal, or
  silent, based on the pattern for the current time signature.

## 5. Tap Tempo & Sound Customization

**What:** A "tap" button that derives BPM from the user's tap intervals,
plus a choice of click sounds (e.g. beep, wood block, cowbell) and an
optional count-in before playback starts.

**Why:** Tap tempo is a standard, expected metronome feature for matching a
song's speed by ear, and sound variety/count-in are low-effort quality-of-life
wins that make longer practice sessions less fatiguing.

**Notes:**
- Tap tempo: record timestamps of the last ~4-8 taps, average the
  intervals, convert to BPM, clamp to the existing 20-300 range.
- Sound options can reuse the oscillator approach (different
  frequency/waveform) before investing in sample playback.

---

## Suggested Sequencing

1. **#4 (real accent patterns)** first — it fixes existing controls that
   currently do nothing, and the lookahead scheduler it requires is a
   prerequisite for #3's auto-advancing tempo.
2. **#1 (session history)** next — establishes the persistence layer
   everything else builds on.
3. **#2 (presets)** — small addition once persistence exists.
4. **#3 (tempo ladder)** — builds on the scheduler from #4.
5. **#5 (tap tempo & sounds)** — independent, can slot in anytime as
   incremental polish.
