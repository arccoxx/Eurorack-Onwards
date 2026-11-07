# AMD Zynq UltraScale+ MPSoC — citation, 2026-11-06

Product page fetched for this release:

https://www.amd.com/en/products/adaptive-socs-and-fpgas/soc/zynq-ultrascale-plus-mpsoc.html

The numbers below are transcribed from that page’s product tables on 2026-11-06. They are AMD’s published device figures, not measurements taken on a board in this project. Place-and-route, clock, and memory leftovers will be smaller.

## What this part is, and what it is not

Zynq UltraScale+ MPSoC is an embedded heterogeneous SoC: application processors, a real-time processor, and 16 nm FinFET+ programmable logic.

| Variant | Processors on the page | Extra block on the page |
|---|---|---|
| CG | Dual Arm Cortex-A53 up to 1.3 GHz, dual Cortex-R5F up to 533 MHz | Programmable logic |
| EG | Quad Cortex-A53 up to 1.5 GHz, dual Cortex-R5F up to 600 MHz, Mali-400 MP2 up to 667 MHz | Programmable logic |
| EV | Same processor story as EG | H.264/H.265 video codec, page claim of simultaneous encode and decode up to 4K at 60 frames per second |

Alveo cards are a different product: datacenter PCIe accelerators. This file does not quote Alveo bandwidth, HBM, or a card SKU, because no Alveo datasheet was fetched for this release. Do not paste Zynq DSP counts onto an Alveo estimate.

## CG programmable logic

Total RAM on the page is maximum distributed RAM + block RAM + UltraRAM.

| SKU | Logic cells (K) | Total RAM (Mb) | DSP slices | Max I/O |
|---|---:|---:|---:|---:|
| ZU1CG | 81 | 4.8 | 216 | 180 |
| ZU2CG | 103 | 6.5 | 240 | 252 |
| ZU3CG | 154 | 9.4 | 360 | 252 |
| ZU3TCG | 157 | 21.2 | 576 | 124 |
| ZU4CG | 192 | 20.6 | 728 | 252 |
| ZU5CG | 256 | 26.6 | 1,248 | 252 |
| ZU6CG | 469 | 32 | 1,973 | 328 |
| ZU7CG | 504 | 44.2 | 1,728 | 464 |
| ZU9CG | 600 | 40.9 | 2,520 | 328 |

## EG programmable logic

| SKU | Logic cells (K) | Total RAM (Mb) | DSP slices | Max I/O |
|---|---:|---:|---:|---:|
| ZU1EG | 81 | 4.8 | 216 | 180 |
| ZU2EG | 103 | 6.5 | 240 | 252 |
| ZU3EG | 154 | 9.4 | 360 | 252 |
| ZU3TEG | 157 | 21.2 | 576 | 124 |
| ZU4EG | 192 | 20.6 | 728 | 252 |
| ZU5EG | 256 | 26.6 | 1,248 | 252 |
| ZU6EG | 469 | 32 | 1,973 | 328 |
| ZU7EG | 504 | 44.2 | 1,728 | 464 |
| ZU9EG | 600 | 40.9 | 2,520 | 328 |
| ZU11EG | 653 | 52.7 | 2,928 | 512 |
| ZU15EG | 747 | 69 | 3,528 | 328 |
| ZU17EG | 926 | 64.7 | 1,590 | 668 |
| ZU19EG | 1,143 | 80.4 | 1,968 | 668 |

The page also lists 32.75 Gb/s transceiver counts for some larger EG devices (16 on ZU11EG, 28 on ZU17EG and ZU19EG) and PCIe configurations that differ by SKU. Use the product table rather than this sentence if you need the exact PCIe string.

## EV programmable logic

| SKU | Logic cells (K) | Total RAM (Mb) | DSP slices | VCU | Max I/O |
|---|---:|---:|---:|---:|---:|
| ZU4EV | 192 | 20.6 | 728 | 1 | 252 |
| ZU5EV | 256 | 26.6 | 1,248 | 1 | 252 |
| ZU7EV | 504 | 44.2 | 1,728 | 1 | 464 |

## Parametric estimate — UNMEASURED

Template, not a benchmark:

`MAC/s ≈ N_DSP_used × f_clk × MAC_per_DSP_per_cycle`

`latency_s ≈ pipeline_stages / f_clk`

`on_chip_state_bits ≤ cited total RAM, and only after the design fits`

Worked assumption for **ZU7EV** only, every factor marked:

- Cited DSP slices: 1,728 (page table, not a utilization report).
- Assumed clocks: 200 MHz. Not taken from a bitstream.
- Assumed MAC per DSP per cycle: 1. Not a synthesis result.
- Product of those assumptions: 1,728 × 200,000,000 = 3.456×10^11 MAC/s.
- Cited total RAM: 44.2 Mb. Not free RAM.

No latency number is filled in, because pipeline depth was not designed. No power number is filled in beyond the page’s own claims (a footnote about up to 30% less static power, and a deep-sleep figure of 180 nW). Those are AMD page claims, not measurements here.

The browser demos do not run on this silicon.
