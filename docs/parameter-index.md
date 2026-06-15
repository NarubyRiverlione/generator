# Parameter Index

Cross-reference of all parameters and concepts. A dot (●) means the row item directly influences the column item.

## Parameters → Outputs and Concepts

|  | Vₜ | P | Q | δ | VSM | Relay 27 trip | AVR behaviour |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| [Field voltage](parameters/field-voltage.md) | ● | ● | ● | ● | ● | ● | — |
| [Xₛ](parameters/xs.md) | ● | ● | ● | ● | ● | ● | ● |
| [Rₐ](parameters/ra.md) | — | — | — | — | — | — | — |
| [τ](parameters/tau.md) | (speed only) | — | — | — | — | — | ● |
| [Load fraction](parameters/load-fraction.md) | ● | ● | ● | ● | ● | ● | ● |
| [Power factor](parameters/power-factor.md) | ● | — | ● | ● | ● | ● | ● |
| [Vref](parameters/vref.md) | ● | ● | ● | ● | ● | ● | ● |
| [Kp / Ki](parameters/kp-ki.md) | — | — | — | — | — | — | ● |

*Rₐ has no meaningful influence on any output at the simulator's resolution (effect < 0.2%).*
*τ does not affect steady-state outputs — only how fast they are reached.*

---

## Parameters → Parameters (indirect influences)

| When you change… | …it affects how this parameter feels |
|---|---|
| Xₛ | How much field voltage you need to hold Vₜ; how quickly VSM drops with load |
| Load fraction | How hard the AVR works; whether the 27 relay arms quickly |
| Power factor | How aggressively load fraction drives VSM down |
| τ | How responsive the AVR feels; how much Kp/Ki matter (Phase 2) |

---

## Concepts and what drives them

| Concept | Primary drivers | Secondary drivers |
|---|---|---|
| [Load angle δ](concepts/load-angle.md) | Load fraction, Xₛ | Power factor, Eₐ |
| [Voltage stability margin](concepts/voltage-stability-margin.md) | Load fraction, Xₛ, power factor | Field voltage (via Eₐ) |
| [Relay 27 trip](concepts/relay-27.md) | Load fraction, field voltage | Power factor, Xₛ |
| [AVR behaviour](concepts/avr.md) | Kp, Ki, τ, Vref | Load fraction, power factor |

---

## Quick lookup — "I want to understand X"

| I want to understand… | Start here |
|---|---|
| Why Vₜ drops when I add load | [Xₛ](parameters/xs.md), [Load fraction](parameters/load-fraction.md) |
| What the AVR is actually doing | [AVR](concepts/avr.md), [Vref](parameters/vref.md) |
| Why the machine tripped | [Relay 27](concepts/relay-27.md), [VSM](concepts/voltage-stability-margin.md) |
| What load angle means | [Load angle](concepts/load-angle.md) |
| Why lagging PF makes things worse | [Power factor](parameters/power-factor.md), [VSM](concepts/voltage-stability-margin.md) |
| How fast the machine responds | [τ](parameters/tau.md) |
| Why Rₐ doesn't matter here | [Rₐ](parameters/ra.md) |
