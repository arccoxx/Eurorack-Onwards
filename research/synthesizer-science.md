# Synthesizer science — distinctions, not a catalog dump

## Different objects people call synthesizers

| Object | What it is |
|---|---|
| Lab function / arbitrary-waveform generator | Bench instrument. Vendors include Keysight, Tektronix, Rigol, Tabor. Not a Eurorack case. |
| Lock-in or boxcar averager | Gated or phase-sensitive averager for repetitive pulses. Stanford Research Systems and Zurich Instruments are current commercial names; Signal Recovery is a legacy name. |
| RF synthesizer | A frequency source. Not a music synthesizer. |
| Eurorack / modular instrument | Musical control-voltage system. |
| FPGA or SoC board | Reconfigurable digital logic. Zynq MPSoC and Alveo cards are different products. See the citation note. |

NMR magnets, MRI scanners, and particle accelerators are not function generators. A storage ring uses RF cavities. Calling the whole machine a ring oscillator is a metaphor.

## Boxcar averager

For a repetitive pulse, open a gate around the pulse, integrate, and average shots. Coherent signal grows faster than incoherent noise; the usual textbook scaling of that average is on the order of √N. That is the scientific point. Musical reuse of NIM-bin modules (public demos associated with Hainbach) is a later artistic use, not the design goal.

No channel-count, sample-rate, or “teraop” figure is given here. Without those inputs a throughput number would be fiction. Zurich Instruments’ digital boxcar claims stay in their own paper; that PDF is not republished.

## VCV Rack and Alveo

VCV Rack plugins are host-CPU code. An Alveo card is a PCIe FPGA. Nothing here shows that Alveo accelerates VCV Rack out of the box. A bridge would be a separate engineering project. On-chip RAM can hold short state. Long samples need off-chip memory. A DAC’s output leaves the chip as analog by definition.

## Memory media

DRAM needs refresh power to keep bits. SRAM is also volatile. Disk and NAND retain bits without refresh and pay for that at access time and, for NAND, in write wear. The slogan “RAM perpetuates energy pathways and disk does not” is a metaphor for active versus passive storage, not a measured energy-flow theory.

## Xbox 360

A specific thesis that an external drive “required live non-hot-swappable writing” as a computational model was **not identified** in a primary hardware document during t472. Ordinary advice not to unplug storage during writes is filesystem hygiene. Status: unknown. Do not promote it.

## Game Boy and Sony

The original DMG audio path is Nintendo hardware. Sony PlayStation SPU is a different chip. Emulators can track digital registers closely. Analog filtering and mixer quirks are only approximately modeled. That distinction is the claim. No ROM is included.

## Timelines that do not cause each other

| Item | Date used here | Label |
|---|---|---|
| von Neumann and Morgenstern, *Theory of Games* | 1944 | Game theory book |
| Shannon, “A Mathematical Theory of Communication” | 1948 | Information theory |
| Dartmouth proposal / workshop | 1955 / 1956 | See the Dartmouth note |
| Solomonoff journal papers | 1964 | Algorithmic probability |
| Conway’s Game of Life, via Gardner | 1970 | Cellular automaton |

Game theory being earlier than Life does not mean it caused Life. Life can be sonified. It does not have to run on a synthesizer. A “Gödel synth” or a Wolfram ruliad patch would be a new art project, not a theorem of Gödel or Wolfram.

## Parallel history demo

A literate side-by-side history program was design notes only. It is not in this release. Status: planned.
