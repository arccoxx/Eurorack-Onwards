# Patch notes — mixer neuron

Same input on both sides of the screen.

| Control | Reference | Patch |
|---|---|---|
| x0, x1, x2 | normalized CV | same numbers, drawn as volts after × volts-per-unit |
| w0, w1, w2 | exact gains | optional knob quantizer |
| bias | exact | same quantizer |
| rail | none | clip in volts, then scale back |
| shaper | tanh | tanh |

Suggested listening metaphor, not a required module list: three attenuators into a unity mixer into a wavefolder or tanh shaper. If you only have a linear mixer, you are in the `linear` shaper case and the output is not bounded.

Export the form with **Export JSON**. Validate before you trust an imported file:

```bash
node implementations/cli.mjs validate examples/mixer-ideal.json
python3 implementations/signal_core.py validate examples/mixer-ideal.json
```
