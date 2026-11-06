# Educational circuit — feedback fixed point

**Label: computational feedback.** The recirculating cable is a discrete-time map. It is not a relativity experiment.

## Modules

- Constant target `c`
- State CV, initial value `x0`
- Feedback attenuator `α`, optional tolerance so the patch gain is `α(1+tolerance)`
- Summer implementing `(1−α_eff)c + α_eff x`
- Optional clamp, the lattice bounds (meet with the high bound, join with the low bound)

## Reading the split screen

Both panes receive the same `α`, `c`, `x0`, and step count. The patch pane adds tolerance. Residual is the absolute gap between endpoints.

## Closed form, and when it is the wrong tool

For the unclamped affine map, `x_n = c + α^n (x0 − c)`, and the step count to an error budget is `ceil(log(eps/|x0−c|) / log(|α|))` when `|α| < 1`. The clamp makes that formula the wrong model: a target outside the interval stops on the boundary. The test `lattice.clamp-blocks-closed-form` checks that the closed form is marked inapplicable.

## Unstable mode

`|α| > 1` increases distance from `c`. The page shows that trace in red-ish terms in the mode field. The iteration stops at the requested step count. It does not “solve” an NP-complete problem and it does not enforce a Deutsch fixed point.
