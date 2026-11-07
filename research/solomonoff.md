# Solomonoff — public note

Primary page: https://raysolomonoff.com/  
Publications list: https://raysolomonoff.com/publications/pubs.html  
Formula image (not copied into git): https://raysolomonoff.com/formula.jpg  
Hashes: `research/SNAPSHOT-HASHES.md`. Catalogue: `publications-catalogue.json`.

## The formula

The memorial image shows a sum, in standard notation, of the form

`P_M(x) = Σ_i 2^{−|s_i(x)|}`

which is the same family as

`P_M(x) = Σ_{p : U(p)=x} 2^{−|p|}`

The sum is over programs that make a reference machine print the finite string `x`. Shorter programs weigh more. The 1964 journal statement is Ray Solomonoff, “A Formal Theory of Inductive Inference,” Parts I and II, *Information and Control* 7 (1964). This note does not reproduce those papers.

## What is supported

- The object is a discrete mixture over programs, not a continuous-time electrical flow.
- It is uncomputable in the strong sense: you have to know which programs halt and print `x`.
- A different universal machine changes the mixture only up to a multiplicative constant tied to the simulator’s size. That invariance is part of the algorithmic-probability literature; this demo does not prove it.

## What is an analogy

Mapping the mixture onto a Eurorack mixer (“short programs are louder”) is a teaching picture. It is not an identity between algorithmic probability and a modular patch. Calling the 1964 sum a continuous flow of digital audio is a metaphor, not the definition.

## What this repository actually runs

One finite prefix-free set of four programs. Kraft sum 1. Given the prefix `1`, the toy’s next-bit probabilities are 1/2 and 1/2. `universal` is false. See `awesome-ai-symposium-synthesis-1954/patches/occams-mixer-patch.md`.

## Planned, not built

`planned-simulations.json` lists the catalogue papers as `planned_not_implemented`. The overnight specification repeated a single finite-mixture lesson for many papers. That is not a library of distinct, tested simulators, and this release does not pretend otherwise.
