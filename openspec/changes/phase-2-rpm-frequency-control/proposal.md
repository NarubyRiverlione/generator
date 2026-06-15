## Why

Phase 1 fixes rotor speed at 50 Hz, which obscures the key teaching point that frequency and voltage are *independently* controlled — the turbine governor sets P/frequency, and the exciter sets voltage/Q. Phase 2 unlocks rotor speed as a user input so learners can directly observe that separation before Phase 3 introduces grid synchronisation (which requires it as a prerequisite).

## What Changes

- Add a turbine governor slider (47–53 Hz) that sets rotor speed
- Make internal EMF Eₐ proportional to rotor speed (Eₐ scales with pu speed)
- Output frequency now tracks rotor speed directly (not fixed at 50 Hz)
- Active power output gains a speed-dependent component — at off-nominal speed, P deviates from the load demand, reflecting the governor droop physics
- Add a frequency readout (Hz) to the UI
- Remove the Phase 1 "rotor speed is fixed" restriction from the UI input panel

## Capabilities

### New Capabilities
- `turbine-governor`: The turbine governor control — slider (47–53 Hz, default 50 Hz), the physics of rotor-speed-driven Eₐ and frequency, and the frequency readout displayed alongside terminal voltage

### Modified Capabilities
- `simulation-core`: Speed is no longer fixed at 1.0 pu; the solver SHALL accept pu speed as an input and scale Eₐ by it before solving the circuit; output frequency is derived as f = 50 × speed_pu
- `simulator-ui`: The input panel SHALL expose the turbine governor slider; the "no rotor-speed control in MVP" requirement is replaced by the Phase 2 governor control; a frequency readout SHALL appear in the generator output section

## Impact

- `src/core/simulation.ts` — `SimulatorInputs` type gains `speedHz`, solver scales `Ea` by `speedHz / 50`
- `src/core/types.ts` — `SimulatorOutputs` gains `frequencyHz`
- `src/core/constants.ts` — add `SPEED_MIN_HZ = 47`, `SPEED_MAX_HZ = 53`
- `useGeneratorSimulation` hook — pass `speedHz` from state to core step
- `InputPanel.tsx` — add turbine governor slider
- `ReadoutPanel.tsx` — add frequency readout (Hz, numeric)
- No new dependencies
