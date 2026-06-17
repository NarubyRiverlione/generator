## MODIFIED Requirements

### Requirement: First-order exciter field lag
The core SHALL model the exciter field response as two stacked first-order lags with a combined DC
gain of unity: an exciter lag (τ_exciter = 0.4 s) feeding a main-field-winding lag (τ_field = 1.1 s),
so the field current follows a field-target step with an S-shaped, second-order response rather than a
single exponential. Each lag SHALL be advanced by the real elapsed time per step using the same
exact-exponential form as the existing single lag.

#### Scenario: Field step has a second-order response
- **WHEN** the field target is stepped up
- **THEN** the field current rises with an S-shaped response (initially slow, then faster) rather than a pure single-exponential, and settles at the new target

#### Scenario: Net settling time preserved
- **WHEN** the field target is stepped and the simulation advances several seconds
- **THEN** the field current settles to the new target with an overall time scale comparable to the previous single 1.5 s lag

### Requirement: AVR PI regulation
The core SHALL provide an optional AVR implemented as a PI controller acting on the terminal-voltage
error (Vref − Vₜ) and commanding the field setpoint, with Kp and Ki supplied as adjustable inputs
(defaults Kp = 2.0, Ki = 0.5; ranges Kp [0.5, 5.0], Ki [0.1, 2.0]). The commanded setpoint SHALL be
clamped to [0.5, 1.5] pu and the integrator SHALL include anti-windup so the integral cannot accumulate
while the command is clamped. The AVR command SHALL still pass through the physical field lag.

#### Scenario: High proportional gain overshoots
- **WHEN** Kp is set high and a field step is applied with AVR enabled
- **THEN** the terminal voltage overshoots its reference (peak Vₜ > Vref) before settling, because the field plant is now second-order

#### Scenario: Default gains remain stable
- **WHEN** Kp and Ki are at their defaults
- **THEN** the AVR step response settles without sustained oscillation

#### Scenario: Command stays within limits
- **WHEN** the AVR runs under any input combination, including sustained large error
- **THEN** the commanded field setpoint never leaves the range [0.5, 1.5] and the integrator remains bounded
