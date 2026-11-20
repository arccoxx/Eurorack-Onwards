# Configuring Silicon Instead of Programming It

Notes from conversation 2026-11-20. The question: how do you use a CPU without putting code on it?

## FPGA

FPGAs do this natively. You describe the circuit in HDL (Verilog/VHDL) and the fabric becomes your program — no instruction stream at all. The hardware *is* the program.

## Microcode

The nearest thing a CPU can do. You're editing the interpreter that turns opcodes into control signals — one level below machine code. You're not writing instructions; you're rewriting what instructions mean.

## Mill Architecture

Pushed further: a belt (a sliding register file) and no program counter in the traditional sense. Data just flows through functional units as it becomes ready. Execution order emerges from data availability, not from a sequential pointer.

## Dataflow Machines (1980s)

Dennis and Arvind's tagged-token work. No instruction pointer at all. Execution order emerges purely from data availability — tokens carry tags that match producers to consumers. The purest "no code on the chip" idea that ever got built at scale.

## The Spectrum

- Fixed datapath CPU → microcode edits the interpreter
- Mill → data flows, no PC
- Dataflow → tokens trigger execution, no code pointer
- FPGA → the circuit itself is the program

All of these are moves *down* the abstraction stack, away from the OS and toward the silicon. Relevant to the broader thread: OS layers reduce chip power by millions of times; getting closer to the metal (or replacing the metal's programming model) is the counter-move.

## Open Questions

- Can you get dataflow semantics on commodity x86/ARM without custom silicon?
- Does the Mill's belt model map onto anything in modern GPU warp scheduling?
- Is there a software-only approximation of tagged-token dataflow worth building for the microspan/voice-separation work?

## Cross-Links

- https://github.com/arccoxx/restore-tensorflow
- https://github.com/arccoxx/true-quantum-compute
- https://github.com/arccoxx/language-circuit
