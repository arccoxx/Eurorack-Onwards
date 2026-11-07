# Musical Computation — Separated Notes

**Status:** Open questions and notes separated from the quantums-of-signal framework to avoid confusion. Version: 2026-11-07.

## Core Observation

Musical lattices (circle of fifths, major/minor modes, tonic, intervals, time signatures) are historically privileged choices of discrete levels inside a quantizer. Under the signal-quantization framework they are one possible discrete subset of a continuous voltage continuum. Continuous quantization can snap a residual onto a musical lattice; that is a special case of quantizer-inside-feedback, not a unique computational model.

## Claims Heard and Open Questions

- “Music theory can be used directly for computation.”
- Harmonic vs disharmonic, major vs minor, tonic as ideal vs anti-ideal.
- Time signatures and small integers (2, 3, 4, 5) as computational results.
- Whether these map onto any general approach to computation.
- Whether harmonic computing has a clean integer foundation that is more than labeling of attractors.

## What Is Supported

Any chosen discrete subset can serve as a state space. Pitch quantizers already do this for musical scales. Residual feedback can drive a circulating signal onto those levels. The labels “correct/incorrect,” “ideal/anti-ideal” are human interpretations of the resulting attractors; they do not automatically supply a general-purpose computational calculus.

## What Is Not Yet Established

- A systematic mapping from music-theory constructs onto a complete computational theory.
- Evidence that musical lattices outperform other discrete subsets for non-musical tasks.
- A finished didactic series that shows the true order of application of these principles for machine intelligence.

## Further Questions

1. Can a residual-driven quantizer locked to a just-intonation lattice solve a simple discrete search faster or more stably than a uniform grid?
2. Do time-signature-like periodicities in a delay loop produce measurable computational structure beyond ordinary recurrence?
3. Is there a clean separation between “labeling an attractor musically” and “performing computation”?
4. Where, if anywhere, has a finished “music as computation” formalism been published that goes beyond metaphor?

These notes live in Eurorack-Onwards and in the public repository `musical-computation`.
