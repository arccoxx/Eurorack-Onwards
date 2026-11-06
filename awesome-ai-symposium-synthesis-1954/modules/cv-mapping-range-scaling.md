# CV mapping, range, scaling, power, saturation, stability

This file is the convention used by `implementations/signal-core.js`. It is an educational model. It is not a claim that every Eurorack module uses these voltages, and it does not estimate ±12 V rail current.

## Normalized domain and volts

| Quantity | This model |
|---|---|
| Computational sample | typically −1…1 |
| Volts per unit | default 5, so ±1 maps to ±5 V |
| Gain | dimensionless, often −2…2 in the page, hard-limited by validation to ±1e6 |
| Bias | added in the normalized domain, then multiplied by volts per unit |
| Summer rail | default ±10 V in the patch metaphor |
| Shaper | `tanh` after converting clipped volts back to normalized units |

Scaling alone is unitary. `sum_volts / volts_per_unit` returns the same normalized sum the reference used, until a rail clips or a knob quantizer moves a coefficient. The ideal-match test checks that residual.

## Quantizer

`quantize` matches `Math.round` (half toward +∞): `floor(value/step + 0.5) * step`. Step 0 disables it. A step of 0.1 moves a gain of −0.33 to −0.3. That is enough to leave a residual above 1e-4 on the fixed demo vector.

## Saturation and stability

- The tanh shaper keeps its output in (−1, 1) even when the linear sum is huge.
- The rail sets `saturated` when the volt-domain sum exceeds ±rail before the shaper.
- A linear shaper can leave the normalized range. The page defaults to tanh.
- Validation rejects non-finite numbers and values outside the published caps, so a bad import does not run.

## Feedback stability

The map `x ← (1−α)c + αx` is a strict contraction when `|α| < 1`. Distance to `c` multiplies by `|α|` each step. `|α| > 1` moves away from `c` (the unstable preset). `|α| = 1` is marginal. A clamp (lattice meet/join with the bounds) can stop the state on the boundary even when the unconstrained target is outside. The closed form `c + αⁿ(x0−c)` is only for the unclamped affine map.

## Power

No supply current, no thermal figure, and no Eurorack power-budget number is computed. “Power” here means the exponent in `2^{−|program|}` inside the finite mixture, plus the ordinary word “power” people use for rails. Those are different.

## What is not claimed

A stable feedback loop in this file is not a physical closed timelike curve, not Deutsch’s fixed-point condition, and not a complexity-class result. The earlier CTC notes in this repository describe that limit separately.
