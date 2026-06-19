# Generator Simulator — Project Instructions

## Session startup

Read these files at the start of every session:

- @docs/naming.md — canonical UI component names (Gauge, Knob, SpringLoadedSelector, etc.)
- @docs/roadmap.md — simulation model, phase roadmap, layout, and implementation notes

## Keeping the roadmap correct

`docs/roadmap.md` is the single source of truth for the project's current state and direction. It must
stay accurate — stale parameters, input tables, or stage statuses actively mislead. Treat it as a
living document, not a write-once spec.

**Archiving an OpenSpec change is a mandatory roadmap-update moment.** When a change is archived, before
considering it finished:

1. Mark the corresponding stage/feature ✓ complete (or update its status).
2. Reconcile any parameters, inputs, readouts, or layout the change touched against the actual code in
   `src/core/constants.ts`, `types.ts`, and the components — the code is the source of truth.
3. Record deliberate design decisions that diverge from the original spec (e.g. a specced control that
   was intentionally not exposed), so the roadmap reflects what shipped, not just what was planned.
4. Remove or absorb any placeholder changes the archived work supersedes.
