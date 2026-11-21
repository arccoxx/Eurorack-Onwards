"""Turing Machine module (Music Thing Modular) and LFSR simulation, standalone (numpy + matplotlib).
Run: python turing_machine_lfsr.py -> figures/turing_machine_lfsr.png and prints the checks.
Source stage: arccoxx/continuum-evolution temporal-formalism/stage5-bits (claims B14-B16)."""
import os
import numpy as np
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
HERE = os.path.dirname(os.path.abspath(__file__))


def galois_lfsr16(s, taps=0xB400):
    """One step: the LSB leaves, and if it was 1 the tap mask is XORed back in (feedback of the residual bit)."""
    out = s & 1
    s >>= 1
    if out:
        s ^= taps
    return s, out


def lfsr_period(taps=0xB400):
    s, n = 1, 0
    while True:
        s, _ = galois_lfsr16(s, taps); n += 1
        if s == 1:
            return n


def xorshift32(v):
    v ^= (v << 13) & 0xFFFFFFFF; v ^= v >> 17; v ^= (v << 5) & 0xFFFFFFFF
    return v


def xorshift_is_linear_over_gf2(trials=100, seed=0):
    """Build the 32x32 GF(2) matrix of xorshift32 and check T @ x mod 2 == xorshift32(x)."""
    T = np.array([[(xorshift32(1 << j) >> i) & 1 for j in range(32)] for i in range(32)])
    rng = np.random.default_rng(seed)
    for _ in range(trials):
        x = int(rng.integers(1, 2**32))
        v = np.array([(x >> i) & 1 for i in range(32)])
        y = (T @ v) % 2
        if sum(int(b) << i for i, b in enumerate(y)) != xorshift32(x):
            return False
    return True


def turing_machine(steps, p_flip, length=16, seed=7):
    """Looping shift register: the bit leaving the end is flipped with probability p_flip and re-enters at the start.
    CV out = 8-bit DAC of the first 8 register bits (0..1, multiply by the module's output range)."""
    rng = np.random.default_rng(seed)
    reg = list(rng.integers(0, 2, length)); hist = []
    for _ in range(steps):
        b = reg.pop()
        if rng.random() < p_flip:
            b ^= 1
        reg.insert(0, b); hist.append(list(reg))
    H = np.array(hist)
    return H, H[:, :8] @ (2.0 ** -np.arange(1, 9))


def period(H):
    for P in range(1, len(H)):
        if np.array_equal(H[P:], H[:-P]):
            return P
    return None


if __name__ == "__main__":
    per = lfsr_period(); lin = xorshift_is_linear_over_gf2()
    knobs = {0.0: "5 o'clock: p=0, locked", 0.05: "3 o'clock: p=0.05, slips", 0.5: "noon: p=0.5, random", 1.0: "7 o'clock: p=1, double lock"}
    runs = {p: turing_machine(96, p) for p in knobs}
    print(f"Galois LFSR taps 0xB400 period = {per} (maximal = {per == 2**16 - 1})")
    print(f"xorshift32 linear over GF(2): {lin}")
    for p, (H, _) in runs.items():
        print(f"Turing Machine p={p}: period {period(H)}")
    fig, ax = plt.subplots(4, 2, figsize=(9, 12), gridspec_kw=dict(width_ratios=[1, 1.3]))
    for i, (p, (H, cv)) in enumerate(runs.items()):
        ax[i, 0].imshow(H.T, cmap="Greys", aspect="auto", interpolation="nearest"); ax[i, 0].set_ylabel("register bit")
        ax[i, 0].set_title(f"{knobs[p]}\nperiod {period(H)}", fontsize=10)
        ax[i, 1].step(range(len(cv)), cv, where="post"); ax[i, 1].set_ylim(0, 1); ax[i, 1].set_ylabel("CV (8-bit DAC)")
    ax[3, 0].set_xlabel("clock"); ax[3, 1].set_xlabel("clock")
    fig.suptitle("Turing Machine module: 16-bit loop, recycled bit flipped with prob p\n"
                 f"Galois LFSR 0xB400 period {per} (maximal); xorshift32 linear over GF(2): {lin}", fontsize=11)
    fig.tight_layout(); os.makedirs(os.path.join(HERE, "figures"), exist_ok=True)
    fig.savefig(os.path.join(HERE, "figures", "turing_machine_lfsr.png"))
