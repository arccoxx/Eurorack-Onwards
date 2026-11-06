# Patch notes — fixed-point feedback

1. A DC source holds the target `c`.
2. A feedback VCA is set to `α`.
3. A crossfader or the affine mix `(1−α)c + α x` is the summer. In hardware this is two gains that should sum to 1. If they do not, that is the tolerance term.
4. Optional comparators or clippers implement the lattice bounds.
5. The output returns to the state input one sample later. This model is sample-synchronous. It does not add a physical delay line unless you turn that into a different map.

Presets on the page:

- Stable α = 0.5 toward c = 1
- Unstable α = 1.2
- Tolerance 0.01 at step 6, where the endpoints still disagree by more than 1e-4
- Clamp to [−0.4, 0.4] with c = 1, which stops at 0.4

Do not describe a successful stable preset as time travel.
