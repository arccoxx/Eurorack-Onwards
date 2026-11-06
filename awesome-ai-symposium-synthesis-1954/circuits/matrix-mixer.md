# Educational circuit — matrix mixer neuron

**Label: analogy.** A matrix mixer plus a shaper is a picture of `y = tanh(w·x + b)`. It is not a biological neuron and not a claim that a passive mixer learns.

## Signal path

1. One control-voltage source per input.
2. One VCA / attenuator per gain.
3. A summer, including the bias.
4. An optional rail.
5. A tanh waveshaper.

The machine-readable form is `patchGraphFromMixer` in `implementations/signal-core.js`. Kinds are only `cv-source`, `vca`, `summer`, `constant`, and `waveshaper`.

## Equal-problem check

Feed the same `x`, `w`, and bias to `mixReference` and `mixPatch`. With quantizer off and the rail not hit, the residual is at floating-point noise. Turn the knob step on, or drive the summer into the rail, and the residual becomes the point of the demo.

## Failure to show

If every gain is already on the quantizer grid and the rail is idle, the patch matches the reference. That is a real result, not a broken demo. Use weights such as −0.33 with step 0.1 when you want a visible gap.
