# Phase 5 — Auxiliaries & Starting System

## Concept

Generators do not start themselves. Before the shaft turns, two auxiliary systems must be healthy:
lube oil pressure and DC starting power. Phase 5 makes these prerequisites visible and mandatory —
the operator must manage them, not just observe them.

The educational value is not in the auxiliaries themselves but in the **dependency chain** they
create and the **game loop** that emerges naturally from it.

---

## Components

### Lube Oil Pre-Pump
- Small electric pump (DC-powered) that pressurises the engine bearings before cranking
- Main oil pump is engine-driven — at 0 rpm there is no lubrication; a cold start without
  pre-lubing causes immediate bearing wear
- Operator holds a button for ~5–8 seconds; oil pressure gauge rises from 0 to green
- **Interlock:** starter motor is blocked until oil pressure reaches minimum threshold

### DC Battery Bank
- 24 V starting battery, shared across both generator sets
- Depleted by: pre-lube pump, starter motor engagement
- Cranking draws heavily — a single start attempt costs roughly 30–40% SoC
- **Interlock:** start attempt blocked below 70% SoC; the only recovery is to wait for the charger

### Battery Charger
- Converts 400 V AC (from a running generator) to DC to restore the battery bank
- **Manually enabled** — the operator must switch it on after the generator is running
- Status readout: `OFFLINE / CHARGING / FULL`
- Forgetting to enable it is the most instructive mistake the sim teaches

---

## The Game Loop

```
Sim start → batteries full (100% SoC)
    │
    ▼
Pre-lube Gen 1 → oil pressure builds → battery dips slightly
    │
    ▼
Crank Gen 1 → fires → battery at ~50–60% SoC
    │
    ▼
Gen 1 running → operator enables battery charger (manual step)
    │
    ▼
Charger climbs battery back toward 100% (visible on gauge, takes ~2–3 min)
    │
    ├─ Attempt Gen 2 too early → BLOCKED (battery < 70%)
    │   operator must wait and watch charger work
    │
    └─ Wait for 70%+ → pre-lube Gen 2 → crank Gen 2 → both running
```

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| Hard interlock at 70% SoC | Clean lesson: respect the battery or reset. No ambiguity. |
| Battery charger is manual | Creates a step to forget; passive automatic charging teaches nothing |
| Single shared battery bank | Simpler model; realistic for a small vessel; makes the SoC drain from Gen 1 start directly visible before Gen 2 attempt |
| Sim starts with batteries full | Gen 1 start is easy and drama-free; the challenge emerges naturally for Gen 2 |

---

## Failure Scenarios

**Forgot to enable charger:**
Battery sits at 50–60% after Gen 1 start. Gen 2 attempt is blocked. Operator must trace back,
enable charger, wait for recovery. Lesson: the charger is not optional.

**Gen 1 trips before charger recovers battery:**
Charger goes offline with battery still low. No generator running, battery insufficient to start
either unit. Dead ship. Reset and learn — this is the scenario tug crews train for.

---

## Readouts

| Readout | Type | Notes |
|---|---|---|
| Battery SoC | Gauge | Visible depletion during start attempts |
| Oil pressure (per gen-set) | Gauge | Rises during pre-lube, sustained once engine runs |
| Battery charger status | Indicator | `OFFLINE / CHARGING / FULL` |

---

## Out of Scope for Phase 5

- Separate emergency battery bank (realistic, but adds complexity without new concepts)
- Shore power input for charging (relevant for alongside operations, not the sim's focus)
- Per-gen-set battery banks (single shared bank is sufficient for the teaching goal)
- Coolant temperature (interesting but a separate concept — defer to a later phase)
