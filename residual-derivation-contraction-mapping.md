# Residual Derivation — Contraction Mapping in a Recirculating Loop

## The setup

A continuous signal circulates through a loop (delay, cable, junction). Each pass, the residual — the distance between the circulating voltage and the target (grid level, fixed point, or zero) — is multiplied by a contraction factor alpha < 1, and a fresh error epsilon (noise, external drive, component loss) is added.

## The recurrence

$$r_{k+1} = \alpha \, r_k + \varepsilon$$

with $r_0$ the initial residual.

## Derivation 1 — Unfolding the recurrence

$$\begin{align}
r_1 &= \alpha r_0 + \varepsilon \\
r_2 &= \alpha r_1 + \varepsilon = \alpha^2 r_0 + \alpha\varepsilon + \varepsilon \\
r_3 &= \alpha r_2 + \varepsilon = \alpha^3 r_0 + \alpha^2\varepsilon + \alpha\varepsilon + \varepsilon
\end{align}$$

Pattern: $r_k = \alpha^k r_0 + \varepsilon \sum_{i=0}^{k-1} \alpha^i$.

## Derivation 2 — Geometric series sum

The sum is a finite geometric series:

$$\sum_{i=0}^{k-1} \alpha^i = \frac{1 - \alpha^k}{1 - \alpha}$$

Therefore:

$$r_k = \alpha^k r_0 + \varepsilon \cdot \frac{1 - \alpha^k}{1 - \alpha}$$

As $k \to \infty$, $\alpha^k \to 0$ (since $\alpha < 1$), leaving:

$$r_\infty = \frac{\varepsilon}{1 - \alpha}$$

**The stable floor.** The loop can never get quieter than $\varepsilon/(1-\alpha)$ because every pass injects at least $\varepsilon$ of fresh noise, and contraction can only shrink old error — it cannot erase new error.

## Derivation 3 — Crossover pass count

Set the shrinking old error equal to the stable floor and solve for $k$:

$$\alpha^k r_0 = \frac{\varepsilon}{1 - \alpha} \implies k = \frac{\ln\big(\varepsilon / \big((1-\alpha)r_0\big)\big)}{\ln \alpha}$$

This is the pass count where old error stops mattering and the noise floor dominates. It is the loop's usable precision, computable before any patch is built.

## Eurorack translation

- $\alpha$ = loop gain (VCA CV level, feedback amount). Below 1 = fade. Above 1 = runaway. Near 1 = the fixed-point edge.
- $\varepsilon$ = thermal noise, component loss, external drive leaking into the loop.
- $r_k$ = the audible difference between the circulating tone and the ideal attractor.
- The crossover $k$ = how many delay passes before the loop sounds "settled" rather than "still ringing."

## Anti-pattern (retained)

Claiming the residual must be explicitly computed and patched back as a separate signal. Correction: the residual is the algebraic difference between pre-quantizer and post-quantizer voltages; any mix point that subtracts one from the other already forms it. Explicit residual routing is an optional refinement, not a requirement.

## Connection to the quantization framework

The residual is $x(t) - Q(x(t))$: the part of the signal not yet on the grid. In the moving-grid construction, $Q$ has time-varying levels $L_n(t) = n\Delta(t) + \phi(t)$, so the residual is distance to a deforming lattice. Feeding it back makes the loop chase a grid that the loop itself is moving.

## Stages 1–5 (verbal visualization)

**Stage 1 — The loop.** One oscillator into a delay, delay out to delay in. Residual = $r_0$, the spark the oscillator dumped in. No contraction yet; the tone just circulates.

**Stage 2 — Contraction appears.** A VCA in the loop sets $\alpha$. Each pass: $r \gets \alpha r$. The tone thins. If $\alpha < 1$, it fades toward the floor $\varepsilon/(1-\alpha)$.

**Stage 3 — Parallel paths.** Two delays of different lengths mix. Residuals from each path superpose before the mix point — the superposition analogue. The mix is the snap.

**Stage 4 — The quantizer.** $Q$ projects onto a discrete grid. The residual $x - Q(x)$ is now explicit and audible as the distance between the smooth wave and the stepped output.

**Stage 5 — The moving grid.** $\Delta(t)$ and $\phi(t)$ become continuous voltages. The grid deforms; the residual becomes distance to a moving target. Fixed points become trajectories. This is continuous-to-continuous quantization: the output is always on a level, the levels are always moving, and nothing is ever frozen in time.

## Pipeline past stage 5

- **Stage 6 — Bidirectional snaps.** Two quantizers on opposite sides of one loop, each seeing the other's residual. Fixed point of $Q_2 \circ Q_1$: a mutually consistent pair of discrete levels. On a musical lattice, that pair is a consonant interval.
- **Stage 7 — CTC loop.** Voltage-controlled delay makes $\tau$ itself a function of the circulating state. The clock and the signal become one dynamical object. Constant-time settling for that loop's attractor (not for arbitrary tasks).
- **Stage 8 — Symbol line.** Open alphabet: the set of levels is itself a circulating voltage. Letters become features of the quantizer, not properties of the medium.
- **Stage 9 — Time synthesis.** Phase accumulation as a continuous time coordinate, quantized by the moving grid. The timemachines library's constant-time algorithms as patch topologies.
- **Stage 10 — Self-modifying patch.** Firmware-updatable module (Daisy/Qu-Bit) that rewrites its own topology from the residual. The Gödel-machine slot: no native Eurorack home yet.

Each stage keeps the same falsifiability bar: predict the sound before patching; if the prediction fails, the lens or the loop is wrong.
