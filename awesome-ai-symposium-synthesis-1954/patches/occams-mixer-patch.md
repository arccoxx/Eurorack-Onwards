# Patch notes — finite Occam mixer

**Not Solomonoff’s universal distribution.**

Four prefix-free programs are four VCA channels. The gain of a channel is the metaphor for `2^{−length}`, not a voltage you should copy onto a bench supply.

| Program bits | Output string | Unnormalized weight |
|---|---|---|
| 0 | 0 | 1/2 |
| 10 | 10 | 1/4 |
| 110 | 11 | 1/8 |
| 111 | 1110 | 1/8 |

Kraft sum = 1. Given the observed prefix `1`, the first program is out. The remaining mass is 1/2. The next-bit posterior is 1/2 on 0 (from `10`) and 1/2 on 1 (from `110` and `111`).

A fifth program whose bits are a prefix of another is rejected. The page shows that failure instead of renormalizing a broken code.

The full sum over every program that prints a string is uncomputable here. Nothing in this patch approximates that sum beyond the four lines above.
