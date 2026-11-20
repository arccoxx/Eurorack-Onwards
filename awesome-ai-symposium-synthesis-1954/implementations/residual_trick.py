#!/usr/bin/env python3
"""Residual Trick — Stage 1 reference implementation.
Standing null as cybernetic sensor: room Green's function, re-solve loop,
zero-trick multiplier, infinity-inversion integrator, per-bin balance bank,
Kuramoto order-parameter witness, room-fingerprint classifier.

This is NOT bit-wise-exact emulation code. It is a continuous-time dynamical
system discretized for exploration. The difference matters: digital emulation
reproduces a recording paradigm; this code reproduces a physical process whose
output is defined by convergence, not by sample identity.
"""
from __future__ import annotations
import numpy as np
from collections import deque
from dataclasses import dataclass, field

C_SOUND = 343.0  # m/s


# ---------------------------------------------------------------------------
# 1. Room Green's function (modal form — better for re-solve gradients)
# ---------------------------------------------------------------------------
@dataclass
class RoomMode:
    """One modal term of the room response: complex exponential decay."""
    omega: float      # rad/s
    zeta: float       # damping ratio
    phi: float = 0.0  # spatial phase at the null point


class RoomGreen:
    """Sum of decaying modal oscillators. Impulse response at the null:
        g(t) = sum_n A_n * exp(-zeta_n*omega_n*t) * cos(omega_d_n*t + phi_n)
    Frequency response (complex) at bin b:
        H_b = sum_n A_n / (1 - (w_b/w_n)^2 + 2j*zeta_n*(w_b/w_n))
    """
    def __init__(self, modes: list[RoomMode], amps: list[float]):
        assert len(modes) == len(amps)
        self.modes = modes
        self.amps = np.array(amps, dtype=float)

    def impulse_response(self, t: np.ndarray) -> np.ndarray:
        out = np.zeros_like(t, dtype=float)
        for A, m in zip(self.amps, self.modes):
            wd = m.omega * np.sqrt(max(1e-12, 1 - m.zeta**2))
            out += A * np.exp(-m.zeta * m.omega * t) * np.cos(wd * t + m.phi)
        return out

    def freq_response(self, freqs_hz: np.ndarray) -> np.ndarray:
        """Complex H(f) across bins — used by the per-bin balance bank."""
        w = 2 * np.pi * freqs_hz
        H = np.zeros_like(w, dtype=complex)
        for A, m in zip(self.amps, self.modes):
            wr = w / m.omega
            H += A / (1 - wr**2 + 2j * m.zeta * wr)
        return H


# ---------------------------------------------------------------------------
# 2. Speaker array + drive
# ---------------------------------------------------------------------------
@dataclass
class Speaker:
    position: np.ndarray   # 3D
    theta_phase: float = 0.0
    theta_amp: float = 1.0


def field_at_null(speakers: list[Speaker], room: RoomGreen,
                  freqs_hz: np.ndarray, t: float) -> complex:
    """phi(x_0, t) as complex phasor sum across bins.
    Each speaker contributes H_b(x_0 - x_s) * A_s * exp(j*theta_s).
    """
    total = np.zeros_like(freqs_hz, dtype=complex)
    for sp in speakers:
        # propagation phase from speaker to null (far-field approx)
        d = np.linalg.norm(sp.position)
        prop = np.exp(-1j * 2 * np.pi * freqs_hz * d / C_SOUND)
        H = room.freq_response(freqs_hz)
        total += sp.theta_amp * np.exp(1j * sp.theta_phase) * H * prop
    return total


# ---------------------------------------------------------------------------
# 3. The residual + re-solve loop (Section 3)
# ---------------------------------------------------------------------------
@dataclass
class ResolveState:
    speakers: list[Speaker]
    room: RoomGreen
    freqs_hz: np.ndarray
    K: float = 0.05
    dt: float = 1e-3
    history: deque = field(default_factory=lambda: deque(maxlen=50))

    def residual(self) -> np.ndarray:
        return field_at_null(self.speakers, self.room, self.freqs_hz, 0.0)

    def step(self) -> tuple[np.ndarray, float]:
        """One re-solve step: gradient of ||r||^2 w.r.t. speaker params."""
        r = self.residual()
        self.history.append(np.linalg.norm(r))
        # numerical gradient over (phase, amp) for each speaker
        grad = []
        base = np.linalg.norm(r) ** 2
        eps = 1e-6
        for i, sp in enumerate(self.speakers):
            # phase gradient
            sp.theta_phase += eps
            g_phase = ((np.linalg.norm(self.residual()) ** 2) - base) / eps
            sp.theta_phase -= eps
            # amp gradient
            sp.theta_amp += eps
            g_amp = ((np.linalg.norm(self.residual()) ** 2) - base) / eps
            sp.theta_amp -= eps
            grad.append((g_phase, g_amp))
        for i, (gp, ga) in enumerate(grad):
            self.speakers[i].theta_phase -= self.K * gp * self.dt
            self.speakers[i].theta_amp -= self.K * ga * self.dt
            self.speakers[i].theta_amp = max(0.0, self.speakers[i].theta_amp)
        r_new = self.residual()
        return r_new, float(np.linalg.norm(r_new))


# ---------------------------------------------------------------------------
# 4. Zero trick (balanced bridge) + infinity inversion (pole at origin)
# ---------------------------------------------------------------------------
class ZeroTrickMultiplier:
    """One port servoed to virtual ground: x * 0 = 0 structurally.
    The dropped term is never computed. Output is the asserted stabilized value.
    """
    def __init__(self, stabilized_output: float):
        self.out = stabilized_output
        self._virt_gnd = 0.0

    def multiply(self, x: float) -> float:
        # port B is the servoed virtual ground — term is dropped, not nulled
        return x * self._virt_gnd if False else self.out  # structural drop


class InfinityIntegrator:
    """Pole at the origin: unbounded DC gain, holds an arbitrary constant
    while still nulling residuals. The infinity-side inversion of the zero trick.
    """
    def __init__(self, dt: float = 1e-3):
        self.dt = dt
        self.state = 0.0

    def step(self, input_signal: float, gain: float = 1e6) -> float:
        # high-gain integrator: state += gain * input * dt, clamped softly
        self.state += gain * input_signal * self.dt
        # soft saturation keeps it physical (real op-amps have rails)
        self.state = np.tanh(self.state / 10.0) * 10.0
        return self.state


# ---------------------------------------------------------------------------
# 5. Per-bin balance bank (Section 5) — notches with finite depth
# ---------------------------------------------------------------------------
@dataclass
class BinController:
    """One frequency bin: drives its speaker contribution to null at x_0
    via phase/amp adjustment, NOT gain-to-zero."""
    freq_hz: float
    K_b: float = 0.1
    phase: float = 0.0
    amp: float = 1.0

    def correct(self, bin_residual: complex) -> None:
        # residual phase tells us which way to rotate; magnitude sets gain
        err_phase = np.angle(bin_residual)
        err_mag = abs(bin_residual)
        self.phase -= self.K_b * err_phase
        self.amp -= self.K_b * err_mag * 0.1
        self.amp = max(0.0, self.amp)


class BalanceBank:
    def __init__(self, freqs_hz: np.ndarray):
        self.bins = [BinController(f) for f in freqs_hz]

    def step(self, residual_spectrum: np.ndarray) -> list[BinController]:
        for b, r in zip(self.bins, residual_spectrum):
            b.correct(r)
        return self.bins


# ---------------------------------------------------------------------------
# 6. Kuramoto order parameter — Reading A (hardness witness)
# ---------------------------------------------------------------------------
def kuramoto_order_parameter(phases: np.ndarray) -> tuple[float, float]:
    """r = |<e^{i theta}>|, psi = arg. r ~ 1 means locked (solution found);
    r low + high variance = hard problem still searching."""
    z = np.mean(np.exp(1j * phases))
    return abs(z), np.angle(z)


def kuramoto_step(phases: np.ndarray, omegas: np.ndarray,
                   K: np.ndarray, dt: float = 0.01) -> np.ndarray:
    """Coupled Kuramoto with arbitrary coupling matrix K (the room's G)."""
    diffs = phases[:, None] - phases[None, :]
    coupling = np.sum(K * np.sin(diffs), axis=1)
    return phases + dt * (omegas + coupling)


# ---------------------------------------------------------------------------
# 7. Room fingerprint classifier (Section 10) — envelope mismatch separation
# ---------------------------------------------------------------------------
class RoomFingerprint:
    """3D sonic signature of a room: modal frequencies, dampings, spatial phases.
    Two signals from different rooms -> different fingerprints -> separable by
    model selection, without characterizing the reverberation envelope."""
    def __init__(self, room: RoomGreen, label: str):
        self.room = room
        self.label = label
        # fingerprint = sorted modal frequencies + damping envelope
        self.fingerprint = np.array([m.omega for m in room.modes])

    def classify(self, observed_modes_omega: np.ndarray) -> str:
        # nearest fingerprint in frequency space
        d = np.linalg.norm(self.fingerprint[:len(observed_modes_omega)]
                           - observed_modes_omega)
        return self.label, d


# ---------------------------------------------------------------------------
# 8. Demo: run the re-solve loop, show residual collapse
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    rng = np.random.default_rng(7)
    # synthetic room: 6 modes
    modes = [RoomMode(omega=2*np.pi*f, zeta=z, phi=rng.uniform(0, 2*np.pi))
             for f, z in [(120, 0.02), (240, 0.03), (400, 0.025),
                          (700, 0.04), (1100, 0.05), (1800, 0.06)]]
    room = RoomGreen(modes, amps=[1.0, 0.7, 0.5, 0.3, 0.2, 0.1])

    # 4 speakers around the null
    speakers = [Speaker(np.array([np.cos(a), np.sin(a), 0.0]))
                for a in np.linspace(0, 2*np.pi, 4, endpoint=False)]

    freqs = np.array([100, 250, 500, 1000, 2000.0])
    state = ResolveState(speakers, room, freqs)

    print(f"{'step':>5} {'||r||':>10} {'r_phase':>10}")
    for step in range(200):
        r, mag = state.step()
        if step % 20 == 0:
            print(f"{step:>5} {mag:>10.4f} {np.angle(np.mean(r)):>10.3f}")

    # Kuramoto witness demo
    N = 16
    ph = rng.uniform(0, 2*np.pi, N)
    om = rng.normal(1.0, 0.1, N)
    Kmat = rng.uniform(0, 0.5, (N, N)); Kmat = (Kmat + Kmat.T) / 2
    for _ in range(5000):
        ph = kuramoto_step(ph, om, Kmat)
    r_ord, psi = kuramoto_order_parameter(ph)
    print(f"\nKuramoto order parameter after 5000 steps: r = {r_ord:.4f} (1.0 = locked)")

    # zero trick + infinity integrator sanity
    zt = ZeroTrickMultiplier(stabilized_output=3.14)
    ii = InfinityIntegrator(dt=1e-3)
    print(f"Zero-trick output (term dropped): {zt.multiply(999.0)}")
    for i in range(1000):
        ii.step(0.001)  # small persistent input
    print(f"Infinity-integrator held state: {ii.state:.4f}")
