# Standing-Null Patch (Eurorack) — minimal prototype

Goal: hold a chosen listening point at cancellation while energy still flows.
Reference tone locked by PLL; mic residual drives a second speaker's phase/amp.

## Modules

| Role | Module | Why |
|---|---|---|
| Reference VCO | Doepfer A-110-1 or Cap'n Big-O | stable carrier |
| PLL (carrier lock) | Doepfer A-196 | internal VCO follows reference; phase-diff CV = residual at audio rate |
| Disturbance sense | A-196 #2, ext input = measurement mic (any preamped mic) | second loop's phase error is the room's residual |
| Residual CV processing | Make Noise Maths (channel 4 slew) | slow the re-solve: must be >> acoustic propagation time |
| Speaker modulation | Intellijel Quad VCA or Befaco A*B+C | residual CV modulates speaker-2 level/phase |
| Speakers | 2× powered nearfield + 1× small measurement mic on a stand at x_0 |

## Signal flow

```
REF VCO ──> A-196 #1 EXT IN ──> (phase-diff CV) ──> Maths ch.4 (slew, ~50-200 ms)
MIC   ──> A-196 #2 EXT IN ──> (phase-diff CV) ──> Quad VCA CV
REF VCO ──> Quad VCA IN A ; VCA OUT ──> SPEAKER 2
REF VCO ──> SPEAKER 1 (direct, unmodulated)
```

## What you hear

- Speaker 1 alone: normal tone at x_0.
- Speaker 2 added with PLL-driven modulation: at the frequency where the
  speaker-2→mic path is a half-wavelength out of phase, the residual collapses.
  You hear near-silence *with energy still present* — feel it on skin,
  watch a scope on the mic preamp output: the waveform thins to a thin
  line, not zero, because the field is still flowing; only x_0 cancels.
- Move your head at x_0: the null breaks, you hear a transient thump —
  that thump IS the residual. Its spectrum is the disturbance signature.

## Stability gate

Maths slew must be slower than room-diagonal/343 s. For a 4 m room that's
~12 ms minimum; set 50-200 ms to be safe. Faster = ghosting echo.

## Upgrade path (full-spectrum balance bank)

Replace the single A-196 pair with a filter bank (Doepfer A-104 or
Befaco BF-22) splitting the mic into 4-8 bins, each bin → its own
A-196/VCA pair driving one speaker tap. Per-bin Maths or Pamela's New
Workout clocks stagger the update rates: fast bins catch motion, slowins track thermal drift without cross-talk.
