## ADDED Requirements

### Requirement: Two independent simulation instances, shared tick

The application SHALL maintain two independent generator simulations — Gen 1 and Gen 2 — by calling
`useGeneratorSimulation` twice. Both instances SHALL advance inside a single `useEffect` interval,
calling `step()` on Gen 1 then Gen 2 sequentially with the same `dt`. The two instances SHALL share
no simulation state — no electrical coupling, no shared bus, no shared speed or voltage reference.

The shared-tick arrangement ensures both simulations advance at the same wall-clock rate, keeping
their internal phase angles progressing in lockstep. This is the prerequisite for the synchroscope
in Stage 4b, which compares the phase angle difference between the two machines.

#### Scenario: Both instances advance each tick
- **WHEN** the shared interval fires
- **THEN** `step()` is called for Gen 1 and then for Gen 2 within the same callback, both using the same `dt`

#### Scenario: Inputs are independent
- **WHEN** the user changes a control on Gen 1 (e.g. raises the field excitation)
- **THEN** Gen 1's simulation state changes and Gen 2's simulation state is unaffected

#### Scenario: Both instances expose the same hook interface
- **WHEN** either generator tab is active
- **THEN** the panel receives state and control callbacks from the active instance in the same shape as the single-generator Phase 3d interface

---

### Requirement: Gen 2 always initialises cold-dark

Gen 2 SHALL always initialise from the cold-dark preset (engine stopped, valve 0 %, field 0 pu,
breaker open) regardless of which `?start=` URL preset is active. The URL preset applies only to
Gen 1.

#### Scenario: Gen 2 cold-dark on live-loaded preset
- **WHEN** the app loads with `?start=live-loaded`
- **THEN** Gen 1 initialises from the live-loaded preset and Gen 2 initialises from cold-dark (rpm ≈ 0, breaker open)

#### Scenario: Gen 2 cold-dark on spinning-dark preset
- **WHEN** the app loads with `?start=spinning-dark`
- **THEN** Gen 1 initialises from the spinning-dark preset and Gen 2 initialises from cold-dark

#### Scenario: Gen 2 cold-dark on default preset
- **WHEN** the app loads with no `?start=` parameter
- **THEN** both Gen 1 and Gen 2 initialise from cold-dark

---

### Requirement: STOP force-trips the load breaker

When the STOP command is issued and the load breaker is currently closed, the breaker SHALL open
immediately (in the same tick as the STOP command is received) before the valve begins its ramp to 0.
The machine then coasts to rest under the swing equation and windage with Pe = 0.

This mirrors real emergency-stop procedure: the load is disconnected before the prime mover is cut,
preventing the load from stalling the decelerating shaft.

#### Scenario: STOP with breaker closed opens breaker first
- **WHEN** STOP is commanded while `loadBreaker` is `true`
- **THEN** `loadBreaker` becomes `false` in the same tick, Pe drops to 0, and the valve ramp to 0 begins from that tick onward

#### Scenario: STOP with breaker already open skips trip
- **WHEN** STOP is commanded while `loadBreaker` is already `false`
- **THEN** the valve ramp to 0 begins immediately with no breaker state change

#### Scenario: Machine coasts to rest after STOP
- **WHEN** the valve ramp reaches 0 %
- **THEN** Pm drops to 0 pu and the rotor decelerates to 0 rpm via the swing equation and windage term, with no floor or snap-to-zero

---

### Requirement: No inter-machine coupling in Stage 4a

The two simulation instances SHALL NOT share bus voltage, frequency, or any electrical state in
Stage 4a. Each instance computes its own terminal voltage, frequency, and power balance in isolation.
The coupling required for parallel operation (shared bus, power exchange via droop) is explicitly
deferred to Stages 4b and 4c.

#### Scenario: Independent terminal voltages
- **WHEN** Gen 1 is running at rated voltage and Gen 2 is at 0 V (stopped)
- **THEN** Gen 1's Vt is unaffected by Gen 2's state and vice versa

#### Scenario: Independent frequencies
- **WHEN** Gen 1 is at 50 Hz and Gen 2 is accelerating from rest
- **THEN** Gen 1's frequency is unaffected by Gen 2's speed
