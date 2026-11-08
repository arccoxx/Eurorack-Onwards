# Imagine Prompt — Quantization Stages Visual Series

Copy everything below the line into Imagine (or any image generator). One prompt per stage, or all five in one wide canvas.

---

## Master style prefix (reuse on every stage)

"Minimalist scientific diagram, clean white background, thin dark lines, no shading, no 3D, flat vector style, precise geometry, labels in small sans-serif text, high contrast, poster-like clarity, 16:9 aspect."

## Stage 1 — The Loop

[Master prefix]. A single horizontal sine wave drawn as a thin continuous line across the canvas, entering a rounded rectangle labeled "DELAY" from the left and exiting to the right, with a curved arrow returning from the output back to the input forming a closed loop. A small vertical arrow at the left points at the wave, labeled "r₀ (initial residual)". Below the loop, a small equation: "r₁ = α·r₀". Title at top: "STAGE 1 — THE LOOP".

## Stage 2 — Contraction

[Master prefix]. Same loop as Stage 1, but a small diamond-shaped element labeled "VCA (α < 1)" sits on the return arrow. Three successive sine waves drawn vertically stacked to the right of the loop, each visibly smaller than the last, with arrows between them labeled "×α". A horizontal dashed line at the bottom labeled "ε/(1−α) stable floor". A curved arrow from the smallest wave pointing back up toward the loop showing the residual being reinjected. Title: "STAGE 2 — CONTRACTION".

## Stage 3 — Parallel Paths

[Master prefix]. The oscillator splits at a node into two parallel horizontal paths. Top path: sine wave through a box labeled "DELAY τ₁". Bottom path: same sine wave through a box labeled "DELAY τ₂", with τ₂ visibly longer (more wave cycles shown). Both paths reconverge at a mixer node on the right, where the two waves overlap and partially cancel — one peak landing on the other's trough, drawn as a thinner combined wave. A bracket under the overlap labeled "superposition before mix = snap at mix". Title: "STAGE 3 — PARALLEL PATHS".

## Stage 4 — The Quantizer

[Master prefix]. A smooth sine wave enters from the left. At a vertical dashed line labeled "Q", the wave transforms into a staircase: flat horizontal segments connected by vertical jumps, each flat segment sitting at a discrete level. Below the staircase, a second thin line traces the original smooth wave for comparison, showing the gap between curve and steps. An arrow from that gap points to a small expression "x − Q(x) = residual". Title: "STAGE 4 — THE QUANTIZER".

## Stage 5 — The Moving Grid

[Master prefix]. A staircase as in Stage 4, but each step's height and position visibly shifts: the vertical grid lines are slanted rather than vertical, and small arrows on the grid lines indicate motion (the levels sliding up and down). The staircase output follows the moving levels, remaining perfectly on a level at every instant while the levels themselves deform. A small sine wave labeled "Δ(t)" modulates the step spacing; another labeled "φ(t)" shifts the offset. A bracket at the bottom: "continuous-to-continuous: always on a level, levels always moving". Title: "STAGE 5 — THE MOVING GRID".

## Optional combined canvas

[Master prefix]. Five panels in a horizontal row, each a miniature of Stages 1–5 above, connected by thin arrows left to right showing progression from loop to contraction to parallel paths to quantizer to moving grid. Each panel has its stage number. Overall title: "QUANTIZATION VIA THE RESIDUAL — FIVE STAGES".
