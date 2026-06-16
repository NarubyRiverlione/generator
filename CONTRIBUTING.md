# Ways of working

This project is a **means to learning**, not a product. The simulator exists to build intuition about
synchronous machines; the code and specs are scaffolding for that. That framing changes how we work.

## Drift is the point — *unrecorded* drift is the problem

New understanding shows up as new features ("I should model saturation to see the AVR ceiling"). That
is healthy and expected — it is the project working. The failure mode is not adding unplanned features;
it is letting **code outrun the written record** until the specs and docs no longer match the code. When
that gap grows, you stop being able to trust what's written, and reconciling it later is expensive.

So the goal is not *less drift*. It is **drift that always lands somewhere intentional and leaves the
record true.**

## Capture, don't engage

When a new thought, feature, or insight appears mid-work:

1. **Capture it as an OpenSpec change** (a one-line proposal stub is enough). This is a Kanban card.
2. **Do not engage with it directly.** Keep working the current change.
3. **Decide placement deliberately:** does it belong in the current change, or is it its own change?

Pre-AI, the effort of implementing was a natural brake — rabbit-holing was expensive, so parking the
idea was the easy path. AI removed that friction: a new thought can be built in the time it takes to
describe it. The capture habit therefore has to be reinstated *deliberately*, as a rule, because nothing
stops you anymore.

This is a two-person reflex:
- **Author:** name a new thought as a card, not a task.
- **AI assistant:** when a new thought surfaces mid-change, offer *"want me to stub that as a change and
  keep going?"* — offer the card, don't grab the shovel. Surface the *placement* question, not just
  permission to build.

## OpenSpec is the Kanban board

- A **change** = a card. A one-line proposal stub is a valid backlog item.
- `openspec list` = the board (open changes = to-do / in-progress).
- `openspec/changes/archive/` = the Done column.
- "Don't engage directly" = an idea doesn't become code until it's a card you've chosen to pull.

## Keep the record true

- **Changed behaviour → spec delta in the same commit.** Never let code ship without its spec moving too.
- **Phases (and changes) must actually close** — archive them. A closed change is immutable: new ideas
  become *new* changes, they cannot quietly re-open a finished slice.
- Run `openspec validate --strict` before archiving.

## Health check

Measure progress in **archived changes, not features.** Healthy work is a growing pile of *closed,
archived* changes — each one a captured understanding plus a working, specced slice.

**Warning light:** more than one or two open changes at once, or canonical specs that don't match the
code. When that light is on, stop and reconcile before adding anything new. (A glance at `openspec list`
shows it.)

## Don't over-correct into ceremony

The point of the specs is to keep the record true *cheaply*, not to gate curiosity behind paperwork. If
capturing an insight ever feels heavier than having it, the process is wrong — simplify it. Plan before
implementing, but keep the planning proportional to the change.
