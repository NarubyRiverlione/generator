# Bugs

## not enough power

Because of the (realistic) added losses (saturation , load drops rpm,...) is wasn't possible anymore to go 100% load with power factor 0.85 and excitor 1.5

Changes made to max excitor to 1.7, which is fine for this learning project.
But:

- max load was also increased to 150%, which I didn't ask. 120% seems a nice value to experiment with.
- power factor is now fixed an 0.92, not changeable. It's ok to start the sim with 0.95 but it should be adjustable to al least 0.8 on full load
- adding max excitor needs also adjustments in the max value of the excitor and rectifier output gauges.
  (check if other adjustments are needed)

  ## ACTIVE POWER gauge

  rated 400 V output should show as green. Adjust the max value of the gauge to it can should 420.
  Change color bands: 0-390 orange, 390-410 green, 410-420 red
  (think about if we need to change this to logarithmic scale )

  ## LCD
  - remove valve position as this has now it own position indicator.
  - suggest if other meaningful values can be showed now that we have new factors coded (saturation, load droop, ... )
