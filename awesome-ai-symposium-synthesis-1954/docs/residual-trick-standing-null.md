# Residual Trick — Standing Null as Cybernetic Sensor
**Stage 1 of 2.** Stage 2 will extend this into the quantum-hardness / Ising-Kuramoto version for the room. Nothing in this document is deleted or altered by that extension; it is additive.

---

## 0. One-line statement

Drive a room so that a chosen point is a standing null — energy flows, the field is not silent, but the observable at that point cancels. Any disturbance injects a residual. The residual is both the error to correct and the signature of what disturbed the field. Same channel, two readings.

---

## 1. The standing field

Drive a room with speaker array S at drive signal d(t). The acoustic field at any point x is the superposition

$$\phi(x,t) = \sum_{s \in S} G(x - x_s, t) \ast d_s(t)$$

where G is the room's Green's function encoding all reflection paths, and d_s(t) is the drive to speaker s at position x_s.

Choose the d_s so that at a chosen null point x_0,

$$\phi(x_0, t) = 0 \quad \text{for the target band.}$$

That is the standing current of acoustic potential: energy is flowing through the room, the field is not silent, but the observable at x_0 cancels. This is the continuous-space analogue of a balanced bridge.

**Why it works without getting ahead of the wavefront.** Cancellation is not prediction of a future wavefront. It is the re-solve of a residual that has already arrived. The controller acts on r(t) = phi(x_0, t), which is measured at x_0 after propagation. The "prediction" that kills ghosting is the room's own Green's function used as the forward model: the controller knows, from the residual's structure, what drive change restores the null, because the residual already contains the propagated effect of the current drive state.

**Stability condition.** The re-solve loop bandwidth must be slower than the acoustic propagation time across the room (roughly room-diagonal / 343 m/s). Otherwise the controller chases its own wavefront and you get the ghosting echo / delay artifact. At 1 kHz the wavelength is ~34 cm, so the quiet zone is a bubble, not a room. ANC products survive by targeting low tonal content (transformer hum, road noise) where the zone is large enough to matter.

---

## 2. The residual

$$r(t) \equiv \phi(x_0, t)$$

In the ideal case r is identically zero. Any physical disturbance — a body moving, a door opening, thermal drift shifting path lengths, humidity changing the speed of sound — injects a transient r(t) ≠ 0.

The residual is the only information the controller receives. This is Wiener's error signal and Ashby's variety that must be absorbed. Two readings of the same channel:

- **Fast time scale:** r is the error to correct. Gradient descent on ||r||_W² (sliding window W) steers the speaker parameters back to the null.
- **Slow time scale:** r is the signature of what disturbed the field. Frequency content, spatial origin (via differential residuals across multiple null points), decay shape — all live in r before any correction acts.

A slow thermal drift looks different from a person walking through. The residual is not remembered separately; it is the shape the field currently holds. This is the storage/retention question from the conversation: the absorbed trace *is* the residual.

---

## 3. The re-solve loop

Let θ(t) be the vector of speaker drive phases and amplitudes. Dynamics:

$$\dot{\theta} = -K \nabla_\theta \|r\|_W^2$$

When r is zero the gradient vanishes and θ holds — equilibrium, not runaway. When r spikes, the gradient points the direction that restores the null. This is negative feedback on the residual, which is why it converges instead of ringing.

Pseudocode:

```python
# re-solve loop, one null point, N speakers
def resolve_loop(room_greens, drive_fn, null_point, dt=1e-4, K=0.1, window=0.05):
    theta = np.zeros(N)          # phases + amplitudes per speaker
    r_hist = deque(maxlen=int(window/dt))
    while True:
        d = drive_fn(theta)                       # speaker drives
        phi_null = sum(convolve(G(null_point - xs), ds) for xs, ds, G in zip(positions, d, room_greens))
        r_hist.append(phi_null)
        r = np.array(r_hist)
        grad = numerical_gradient(lambda th: l2_norm_window(th, r), theta)
        theta = theta - K * grad * dt
        # stability gate: skip update if loop rate > acoustic propagation rate
        yield theta, r[-1]
```

The key line is the gradient: it is taken with respect to speaker parameters, through the room Green's function. The room is inside the derivative. That is what makes the correction physical rather than arbitrary.

---

## 4. The zero trick and its infinity inversion

**Zero side.** In exact arithmetic, x · 0 = 0. A multiplier with one port servoed to virtual ground drops a term without introducing intermediate numerical dynamics — you assert the stabilized output directly. In circuit terms: a balanced bridge, or a differential pair whose common-mode is rejected. The "mathematically impossible" intermediate state is never computed; it is structurally excluded.

**Infinity side.** Invert: replace the zero-multiplier with an integrator whose DC gain is unbounded — a pole at the origin. It holds an arbitrary constant (the "infinity" direction) while still nulling residuals. High-gain integrator, not a saturated amp.

**Where the formulas are not quite equations.** An equation asserts equality across a space. A formula is a directed computation — input flows forward to output. The zero trick and infinity inversion are formulas, not equations: they prescribe a computational direction (drop this term; hold that constant) rather than a relation that holds symmetrically. Logic inherited the equation's static grid from math and lost the flow. Eurorack modules already run formulas as circuits but don't name them that way. The opportunity is treating every patch as a formula whose fixed points are the equations it implies.

Alternatives to consider at each site:

| Site | Zero-side options | Infinity-side options | Property that differs |
|---|---|---|---|
| Term dropping | virtual-ground multiplier, balanced bridge, common-mode rejection | pole-at-origin integrator, high-gain op-amp with clamp | whether the dropped term is structurally absent or actively nulled |
| Constant holding | sample-and-hold, capacitor memory | unbounded integrator, digital latch with analog output | whether the held value can drift |
| Residual reading | single-point mic, pressure sensor | differential pair across two null points | spatial resolution of the disturbance signature |

---

## 5. Notches as balance points, not blockouts

A classic feedback suppressor (e.g., dbx AFS, Behringer Shark) parks a narrow notch on a ringing frequency and kills it — gain to zero at that bin. Total blockout.

The field version inverts this. Instead of one narrow notch per frequency, the residual r(t) feeds a continuous bank of narrowband controllers, each tuned to a bin across the full spectrum. Each bin's controller drives its speaker contribution so that bin sums to zero *at the null* — but the correction is a phase and amplitude adjustment, not a gain-to-zero. The signal still exists in the field everywhere except x_0. Balance is a notch with finite depth whose walls are the re-solve dynamics.

Per-bin controller (one of N_bins):

$$\dot{\theta}_b = -K_b \frac{\partial}{\partial \theta_b} \left| \sum_{s} H_b(x_0 - x_s) \, d_s(\theta) \right|^2$$

where H_b is the bandpass Green's function restricted to bin b. The full-spectrum null is the product structure across bins; each bin is an independent re-solve with its own time constant, which is what lets slow thermal drift and fast motion be handled at different rates without cross-talk.

---

## 6. Delay lines as dissipation into length

A delay line is not memory in the storage sense — it is the Green's function stretched across physical distance. You use it when the junctions you need are not co-located. The alternative, keeping everything at one junction, only works for systems small compared to the wavelength of interest. Once spatial extent matters, delay is the topology, not an add-on.

In the room: the delay from speaker s to null point x_0 is |x_0 - x_s| / c. The re-solve loop's forward model must include these delays or it will be wrong by exactly the propagation time. This is also why the stability gate (Section 3) exists: the loop must not update faster than the slowest relevant delay.

---

## 7. The high-dimensional synthesizer

Extra dimensions are additional integrator-multiplier chains whose states are coordinates on an auxiliary manifold. Mechanical translations in base space appear as drifts or locking terms in those coordinates. The whole object is one continuous dynamical system — no layer boundaries, no serialization of what is naturally parallel.

TensorFlow / tensor-core chips are built for exactly this: batched matrix multiplies are the discrete skeleton of continuous tensor flow. But the programming model exposes gradient steps instead of flows. The missing interface is a continuous-time scheduler that treats the chip as an analogue computer with a clock, not a discrete optimizer. People who are not stupid are presumably doing this in secret; the public API does not expose it.

---

## 8. PLL, Kuramoto, Ising — the quantum-hardness layer (Stage 1 documentation, Stage 2 target)

### 8.1 What a PLL actually is

The Doepfer A-196 (and the Sound + Voltage deep-dive video on it, Feb 2026) implements a phase-locked loop: an internal VCO, a phase comparator, and a loop filter, in a feedback loop. The phase comparator outputs an error proportional to the phase difference between the external reference and the internal VCO. The loop filter smooths that error into a control voltage that tweaks the internal VCO's speed until the phase difference is constant. Phase-locked means: not the same phase at the same instant, but a *constant distance* between phases.

Three uses that matter here:

1. **Oscillator follower** — the internal VCO locks to and tracks an external source.
2. **Frequency multiplier** — the loop can lock at harmonics; the A-196's divider/multiplier modes give subharmonics and overtones.
3. **FM-broadcast texture** — patching audio through a PLL produces the classic "over the radio" effect, because broadcast FM demodulation is itself a PLL.

### 8.2 Kuramoto as the canonical reduction

The Stuart-Landau normal form near a Hopf bifurcation reduces many oscillator implementations (including degenerate optical parametric oscillators, DOPOs) to phase dynamics. The resulting equation combines the standard Kuramoto phase-difference coupling with an intrinsic phase-sum term from conjugate coupling:

$$\dot{\theta}_i = \omega_i + \sum_j \left[ K_{ij}^{\text{diff}} \sin(\theta_i - \theta_j) + K_{ij}^{\text{sum}} \sin(\theta_i + \theta_j) \right]$$

(The sum term is what makes parametric-oscillator Ising machines work without explicit second-harmonic driving.)

### 8.3 Ising mapping

Binary phases {0, π} map to Ising spins s_i = cos θ_i ∈ {+1, −1}. The Kuramoto network's energy function has fixed points that map to the Ising energy at binary phases. Oscillator-based Ising machines (OIMs) therefore solve combinatorial optimization by letting phase dynamics relax to low-energy states. Key result from the literature (arXiv:2105.07591, 2505.22631, Phys Rev Applied 21 044042): Kuramoto-based OIMs achieve polynomial scaling and match the best classically possible approximation quality (semidefinite-programming relaxation level) in near-linear time in problem size — *provided* the binarization/rounding step is handled carefully. Amplitude heterogeneity scales the spin-interaction strength and degrades solution quality monotonically.

### 8.4 The quantum-hardness reading

Two readings are live and must be kept separate:

- **Reading A (hardness witness):** the PLL/Kuramoto loop produces a continuous signal whose synchronization residual, lock time, and amplitude heterogeneity are diagnostics of the computational difficulty of the problem being solved. Hard problems take longer to lock, show more amplitude scatter, and have higher residual variance. This is a *signal that tells you the hardness*.
- **Reading B (actual computation):** the coupled-oscillator network *is* doing the computation — the phase-locked state is the solution. No witness needed; the physics is the solver.

Stage 1 documents both. Stage 2 builds the version where Reading B is the primary mode and the room-scale standing-null field is the physical substrate: speaker phases as oscillator phases, room Green's function as the coupling matrix K_ij, residual r(t) as the energy-gradient signal. The Doepfer A-196 is the one-node prototype of that substrate.

### 8.5 Tape-loop length for neural synthesis

For a learning layer running on a delay/tape loop (cf. "La Synthèse Humaine" neural-synthesis video), the longest loop sets the lowest frequency that can still be updated. Length L should satisfy L ≳ v / f_min where v is effective propagation speed and f_min is the slowest process to adapt. Fourier duality between the time-domain loop and frequency-domain representation is exact for periodic or windowed segments — parallel updates in frequency become serialized updates along the loop. The word the user was reaching for is not "perpetually"; it is *perpendicular time reorganization*: the loop axis is orthogonal to the update axis.

---

## 9. Spatial audio — how it works

Three cues, duplex theory plus pinna:

1. **ITD** (interaural time difference): path-length difference between ears. Woodworth's formula for a rigid sphere of radius a: ITD = (a/c)(θ + sin θ) for azimuth θ.
2. **ILD** (interaural level difference): head shadow. Dominates above ~1.5 kHz.
3. **HRTF** (head-related transfer function): direction-dependent filtering by pinna, head, torso. Encodes elevation and front/back via spectral notches — the pinna acts as a miniature reflector array; a sound from above bounces off the concha and interferes destructively at a notch frequency f = c / (2Δ), where Δ is the reflection path difference. Move the source and the notch moves.

Binaural rendering: convolve mono source x(t) with left and right HRIRs h_L, h_R:

$$x_L(t) = h_L(t) \ast x(t), \quad x_R(t) = h_R(t) \ast x(t)$$

HRTFs are empirically minimum-phase, so phase is determined by magnitude alone — which is why a simple EQ-shaped filter can fake a lot of spatialization. SOFA files are the standard interchange format.

**Connection to the residual trick:** an HRTF is itself a Green's function — the scattering response of a rigid body (the head) to an incident field. The room's G(x, t) and the listener's HRTF are the same mathematical object at different scales. A room fingerprint (Section 10) is an HRTF for the room.

---

## 10. Room fingerprinting — the 3D sonic signature

Sweep or impulse the room; the response at each mic position is the room's impulse response, whose Fourier transform is the room's transfer function per location. Collect across a grid and you have a 3D map of the room's acoustic Green's function — nodes, antinodes, modal structure, decay per band.

**The cross-room separation trick.** If two signals arrive from different rooms (or different regions of one room with distinct modal envelopes), their residuals against a shared standing-null field are *structurally different*: different Green's functions, different path-delay sets, different modal decay. You do not need to characterize or invert the reverberation envelope — you classify by envelope mismatch. Signal A matches null-field model G_A; signal B matches G_B ≠ G_A; the residual for each is minimal only under its own model. Separation is then a model-selection problem (which Green's function explains this residual best), not a deconvolution problem. This is blind source separation where the "source" is partly the *space*.

---

## 11. Eurorack patches and hardware examples

### 11.1 Standing-null prototype (minimal)

- **Doepfer A-196 PLL** × 2: one locked to a reference tone (the "carrier"), one as the disturbance-sensing oscillator. Their phase-difference CV is the residual r(t) at audio rate.
- **Intellijel Quad VCA** or **Befaco A*B+C**: amplitude/phase modulation of speaker feeds driven by the residual CV.
- **Make Noise Maths** or **4ms Ensemble Oscillator**: slow envelope for the re-solve time constant (must be >> acoustic propagation).
- **2× speakers + 1× measurement mic** into a preamp whose output feeds the A-196's external input.

Patch: ref VCO → A-196 input 1; mic → A-196 input 2; phase-diff CV → VCA CV in; VCA modulates speaker 2's level. When the room's reflection path from speaker 2 to mic hits a half-wavelength condition at the reference frequency, the residual collapses — you hear the null *as silence with energy still present* (feel it on skin, see it on a scope).

### 11.2 Full-spectrum balance bank

- **Doepfer A-100 Filter Bank** (or a set of narrow bandpass filters): splits the mic signal into bins.
- Per bin: **A-196** or a simple phase comparator + **VCA** pair, each driving one speaker contribution.
- **ALM Pamela's New Workout** or **4ms QCD**: staggered clock for per-bin update rates (fast bins for motion, slow bins for thermal drift).

### 11.3 Kuramoto / Ising reading on hardware

- **Steady State Fate Quantum Rainbow 2** (used in the Sound + Voltage FM-via-PLL patch) as a multi-phase oscillator bank.
- Couple phases through a **matrix mixer** (Veils, Linix) with crossfader-controlled K_ij.
- Read the global order parameter: sum the phases through a summer into a scope or spectrum analyzer. Lock = low residual variance = solution found. This is Reading A (hardness witness) on a breadboard.

### 11.4 What people are actually doing

- **Jay Hack — Active Sound Control Lab**: continuous ring of speakers canceling outside while preserving interior field; discrete array steering a quiet bubble at a tracked moving person with real-time phase recompute. Closest working implementation of the standing-current idea, aimed at silencing rather than sensing.
- **Canon patent**: standing-wave detection rig walking a mic through a room, mapping nodes/antinodes from pressure dips.
- **Yamaha patent**: feedback-comb standing-wave attenuator for car cabins.
- **UW seven-bot mic swarm**: auto-positioning to carve mute zones or isolate one conversation.
- **2026 arXiv privacy-aware audio occupancy sensing**: maps raw sound to occupied/not without storing speech.
- **Parametric-oscillator Ising solvers** (Phys Rev Applied 21, 044042): shown to *exactly implement* the primal-dual Lagrange-multiplier optimization algorithm — signal-oscillator voltages are the binary variables, pump-oscillator voltages are the Lagrange multipliers. This is the strongest evidence that Reading B (actual computation) is not mystical: the circuit equations are the optimizer.

---

## 12. What Stage 2 adds (not built here)

- Room-scale Kuramoto network: speaker phases as θ_i, room Green's function blocks as K_ij, residual r(t) as the energy signal.
- Quantum-hardness extraction: lock-time distribution and amplitude-heterogeneity statistics as a continuous witness of problem difficulty, with a threshold for switching from Reading A to Reading B.
- Robustification: temperature/humidity feedforward into the Green's function model; multi-null differential residuals for spatial triangulation of disturbances; formal stability proof of the re-solve loop against bounded Green's-function error.

---

## 13. Open alternatives and non-equations

Where the formalism is not yet an equation but a formula-with-choices:

- **Green's function representation**: impulse-response form vs. modal decomposition (sum of decaying complex exponentials). Modal form is better for the re-solve gradient; impulse form is better for the zero-trick term-dropping.
- **Residual norm**: L2 (energy) vs. L1 (sparse disturbances) vs. a learned norm. L2 is the safe default; L1 catches single-point motion better.
- **Coupling K schedule**: fixed vs. annealing (decrease K as residual falls, to avoid overshoot). Annealing matches the infinity-inversion integrator's natural behavior.
- **Binarization**: hard sign(cos θ) vs. soft sigmoid. Hard is the Ising limit; soft is more robust to amplitude heterogeneity but loses the exact spin mapping.

Each choice is a formula. The equations emerge at the fixed points.
