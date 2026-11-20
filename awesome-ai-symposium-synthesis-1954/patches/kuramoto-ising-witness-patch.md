# Kuramoto / Ising Witness Patch — Reading A on hardware

Goal: couple oscillator phases through a programmable matrix; read the
global order parameter as a continuous hardness witness.

## Modules

| Role | Module |
|---|---|
| Phase bank (4-8 oscillators) | Steady State Fate Quantum Rainbow 2 (multi-phase outs) or 4× A-110-1 |
| Coupling matrix K_ij | Befaco BF-22 matrix mixer or Intellijel μMIDI + matrix |
| Crossfader on K strength | Any crossfader into matrix CV |
| Sum / order readout | Doepfer A-138 (mixer) → scope or spectrum analyzer |
| Optional: subharmonic lock | Doepfer A-196 on one node for binary-phase forcing |

## What to watch

- Scope on the summed output: when r (Kuramoto order) → 1, the sum
  collapses toward a single sinusoid — the network locked, the "solution"
  is the locked state.
- Spectrum analyzer: lock shows one dominant peak; searching shows a
  spread of partials whose variance tracks problem hardness.
- Amplitude heterogeneity: if one oscillator's output is much larger than
  the others, solution quality degrades (per the Phys Rev Applied 2026
  parametric-oscillator analysis). Watch per-oscilloscope traces.

## Mapping to the room

In Stage 2: speaker phases play the role of θ_i, the room's Green's
function blocks play K_ij, and the standing-null residual r(t) is the
energy-gradient signal the network descends. This patch is the
one-dimensional prototype.
