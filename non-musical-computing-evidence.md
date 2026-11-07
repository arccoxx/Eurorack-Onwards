# Non-Musical Eurorack Computing Evidence Base

Compiled from research on 2026-11-07. All resources below treat Eurorack as a computing substrate, not a musical instrument.

## Measurement & Debugging Instruments

- **Mordax DATA** — Four-channel oscilloscope, spectrum analyzer, tuner, dual waveform generator, clock. Used to observe voltages, calibrate modules, debug patches. The telescope, not the computer.
  - Search: "Mordax DATA module review scope spectrum"

## Samplers & Performance Computers

- **1010music bitbox mk2** — 64 MB RAM, 4 GB microSD streaming, granular, slicing, clip launching. Alternate firmwares for effects and wavetable synthesis. Performance tool, not general-purpose.
  - Search: "1010music bitbox mk2 review"

- **ER-301 (Orthogonal Devices)** — Digital sound computer hosting custom units, buffer recording. Digital counterpart to analog computing.
  - Search: "ER-301 sound computer"

## Analog Computing Subculture

- **qetu (Mod Wiggler)** — Built an entire analog computer from ordinary Eurorack modules: integrators, summers, multipliers, comparators. Gave workshop at SchneidersLaden, Berlin, March 2025, alongside a vintage analog computer.
  - Search: site:modwiggler.com qetu analog computer
  - Workshop: SchneidersLaden Berlin, March 2025

- **stromkult "modular computing" feature** — Coverage of modular synths as analog computers.
  - Search: stromkult modular computing

- **Lazzarini & Timoney (2019)** — "Analog computers as voltage-controlled synthesizers" re-appraisal. Notes modular synths were always special-purpose computers: modules as program components, patch cords as the program.
  - Search: "Lazzarini Timoney analog computers voltage-controlled synthesizers 2019"

- **eurorack-cpu (GitHub)** — Full CPU implemented in a modular synth in VCV Rack: registers, ALU, ripple-carry adder, fetch-decode cycle.
  - Search: github eurorack-cpu

## Embedded ML

- **Neurorack (IRCAM)** — Jetson Nano in 11 HP running real-time embedded deep learning for descriptor-driven synthesis. No laptop required.
  - Search: IRCAM Neurorack Jetson Nano

## Logic from Ordinary Modules

- **Mod Wiggler thread: logic from VCAs** — AND, OR, XOR, flip-flops built from VCAs, mixers, rectifiers alone. No dedicated logic modules needed.
  - Search: site:modwiggler.com logic VCA mixer rectifier

- **Serge triple comparator** — Computes any Boolean function with at most three comparators.
  - Search: Serge triple comparator Boolean

## Open Question (not found in existing literature)

- Live file-writing as standing memory current for self-reading synthesis processes. May be genuinely new territory.

## Relation to Quantum-of-Signal Framework

These resources support the continuous-nonlinear-ODE substrate reading. The qetu computer and eurorack-cpu demonstrate that patch topology + module physics = computation without symbolic scheduling. Neurorack shows embedded ML is feasible in HP-constrained space. The logic-from-VCAs result shows Boolean structure emerges from continuous voltage operations — consistent with the quantization-operator framework where discreteness is a readout event on a continuous trajectory.
