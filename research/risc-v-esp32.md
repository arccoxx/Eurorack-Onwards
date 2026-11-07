# RISC-V and ESP32 — experimenter notes

Confirm the current datasheet before wiring. The hardware HTML crawled in t472 is not republished. Pin voltage and radio certification are device-specific.

## Do not collapse the names

| Part | ISA, as recorded in the t472 note |
|---|---|
| ESP32 (original, Xtensa LX6) | Not RISC-V |
| ESP32-C3 | RISC-V, described there as RV32IMC |
| ESP32-C6 / H2 | RISC-V parts in the same vendor family; check the exact core |
| FPGA soft core | Can be cycle-accurate; a different project from an MCU sketch |

RISC-V is a modular open ISA (base integer, plus extensions). “ESP32 is RISC-V” is false for the original Xtensa part.

## What these MCUs are good at

Millisecond-scale control, MIDI or serial bridges, Wi-Fi telemetry, patch storage, ADC of slow control voltages. They are a poor fit, alone, for cycle-accurate 8-bit or 16-bit buses and for sub-microsecond video timing. 5 V TTL needs a level policy the datasheet allows. Many GPIO pins are 3.3 V.

A common split is an FPGA for the legacy bus and an MCU for USB, network, and the screen.

## Emulation versus the original

Software emulation on an MCU reproduces logic at a coarse time scale. An FPGA can be cycle-accurate and still miss analog behavior. The original chip has both, and the parts may be scarce.

## Legal

Firmware copyright and radio rules still apply when a cheap board replaces a dead controller. This note is not a dump of anyone’s ROM.
