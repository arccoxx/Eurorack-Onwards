/**
 * Residual Trick — Stage 1 reference implementation (JavaScript).
 * Mirror of residual_trick.py: standing null, re-solve loop, zero trick,
 * infinity inversion, per-bin balance bank, Kuramoto witness, room fingerprint.
 *
 * Difference that matters: this is event-loop discretized continuous time.
 * Pseudocode (residual-trick-standing-null.md) is the specification;
 * .py is the precise dynamical system; .js is the same system in the
 * browser/CLI runtime the Eurorack-Onwards site already uses (signal-core.js).
 */

const C_SOUND = 343.0;

// ---- Room Green's function (modal form) ----
class RoomMode {
  constructor(fHz, zeta, phi = 0) {
    this.omega = 2 * Math.PI * fHz;
    this.zeta = zeta;
    this.phi = phi;
  }
}

class RoomGreen {
  constructor(modes, amps) {
    this.modes = modes;
    this.amps = amps;
  }
  freqResponse(freqsHz) {
    // returns array of complex {re, im}
    return freqsHz.map(f => {
      const w = 2 * Math.PI * f;
      let re = 0, im = 0;
      for (let n = 0; n < this.modes.length; n++) {
        const m = this.modes[n], A = this.amps[n];
        const wr = w / m.omega;
        const denRe = 1 - wr * wr;
        const denIm = 2 * m.zeta * wr;
        const mag2 = denRe * denRe + denIm * denIm;
        re += A * denRe / mag2;
        im -= A * denIm / mag2;
      }
      return { re, im };
    });
  }
}

// ---- Speakers ----
class Speaker {
  constructor(x, y, z) {
    this.pos = [x, y, z];
    this.phase = 0;
    this.amp = 1;
  }
}

function fieldAtNull(speakers, room, freqsHz) {
  return freqsHz.map((f, bi) => {
    let re = 0, im = 0;
    for (const sp of speakers) {
      const d = Math.hypot(...sp.pos);
      const prop = Math.cos(2 * Math.PI * f * d / C_SOUND)  // far-field real part
                 + 0; // (full complex prop omitted for brevity; see .py)
      const H = room.freqResponse([f])[0];
      const c = Math.cos(sp.phase), s = Math.sin(sp.phase);
      re += sp.amp * (c * H.re - s * H.im) * prop;
      im += sp.amp * (s * H.re + c * H.im) * prop;
    }
    return { re, im, mag: Math.hypot(re, im) };
  });
}

// ---- Re-solve loop ----
class ResolveState {
  constructor(speakers, room, freqsHz, K = 0.05, dt = 1e-3) {
    this.speakers = speakers;
    this.room = room;
    this.freqsHz = freqsHz;
    this.K = K;
    this.dt = dt;
    this.hist = [];
  }
  step() {
    const r = fieldAtNull(this.speakers, this.room, this.freqsHz);
    this.hist.push(r.reduce((s, x) => s + x.mag * x.mag, 0));
    const base = this.hist[this.hist.length - 1];
    const eps = 1e-6;
    for (const sp of this.speakers) {
      sp.phase += eps;
      const gp = (this._norm2() - base) / eps;
      sp.phase -= eps;
      sp.amp += eps;
      const ga = (this._norm2() - base) / eps;
      sp.amp -= eps;
      sp.phase -= this.K * gp * this.dt;
      sp.amp = Math.max(0, sp.amp - this.K * ga * this.dt);
    }
    const r2 = fieldAtNull(this.speakers, this.room, this.freqsHz);
    return { r: r2, mag: Math.sqrt(r2.reduce((s, x) => s + x.mag * x.mag, 0)) };
  }
  _norm2() {
    const r = fieldAtNull(this.speakers, this.room, this.freqsHz);
    return r.reduce((s, x) => s + x.mag * x.mag, 0);
  }
}

// ---- Zero trick + infinity inversion ----
class ZeroTrickMultiplier {
  constructor(stabilizedOutput) { this.out = stabilizedOutput; }
  multiply(x) { return this.out; } // term structurally dropped
}
class InfinityIntegrator {
  constructor(dt = 1e-3) { this.dt = dt; this.state = 0; }
  step(input, gain = 1e6) {
    this.state += gain * input * this.dt;
    this.state = Math.tanh(this.state / 10) * 10; // soft rail
    return this.state;
  }
}

// ---- Per-bin balance bank ----
class BinController {
  constructor(freqHz, Kb = 0.1) {
    this.freqHz = freqHz; this.Kb = Kb; this.phase = 0; this.amp = 1;
  }
  correct(binResidual) {
    this.phase -= this.Kb * Math.atan2(binResidual.im, binResidual.re);
    this.amp = Math.max(0, this.amp - this.Kb * binResidual.mag * 0.1);
  }
}
class BalanceBank {
  constructor(freqsHz) { this.bins = freqsHz.map(f => new BinController(f)); }
  step(residualSpectrum) {
    residualSpectrum.forEach((r, i) => this.bins[i].correct(r));
    return this.bins;
  }
}

// ---- Kuramoto witness (Reading A) ----
function kuramotoOrder(phases) {
  let re = 0, im = 0;
  for (const th of phases) { re += Math.cos(th); im += Math.sin(th); }
  re /= phases.length; im /= phases.length;
  return { r: Math.hypot(re, im), psi: Math.atan2(im, re) };
}
function kuramotoStep(phases, omegas, K, dt = 0.01) {
  const N = phases.length;
  const next = new Array(N);
  for (let i = 0; i < N; i++) {
    let coup = 0;
    for (let j = 0; j < N; j++) coup += K[i][j] * Math.sin(phases[i] - phases[j]);
    next[i] = phases[i] + dt * (omegas[i] + coup);
  }
  return next;
}

// ---- Room fingerprint ----
class RoomFingerprint {
  constructor(room, label) {
    this.room = room;
    this.label = label;
    this.fingerprint = room.modes.map(m => m.omega);
  }
  classify(observedOmegas) {
    const n = Math.min(this.fingerprint.length, observedOmegas.length);
    let d = 0;
    for (let i = 0; i < n; i++) d += (this.fingerprint[i] - observedOmegas[i]) ** 2;
    return { label: this.label, distance: Math.sqrt(d) };
  }
}

// ---- Demo ----
if (require.main === module) {
  const modes = [[120,.02],[240,.03],[400,.025],[700,.04],[1100,.05],[1800,.06]]
    .map(([f,z]) => new RoomMode(f, z, Math.random()*2*Math.PI));
  const room = new RoomGreen(modes, [1,.7,.5,.3,.2,.1]);
  const speakers = [0,1,2,3].map(i => {
    const a = i * Math.PI/2; return new Speaker(Math.cos(a), Math.sin(a), 0);
  });
  const freqs = [100,250,500,1000,2000];
  const state = new ResolveState(speakers, room, freqs);
  for (let s = 0; s < 200; s++) {
    const { mag } = state.step();
    if (s % 20 === 0) console.log(`step ${s}: ||r|| = ${mag.toFixed(4)}`)
  }
  // Kuramoto
  let ph = Array.from({length:16}, () => Math.random()*2*Math.PI);
  const om = Array.from({length:16}, () => 1 + (Math.random()-.5)*.2);
  const K = Array.from({length:16}, (_,i) => Array.from({length:16}, (__,j) => .25*(Math.random()+ (i===j?0:1)))).map((row,i)=>row.map((v,j)=>(v+row[j])/2));
  for (let t = 0; t < 5000; t++) ph = kuramotoStep(ph, om, K);
  console.log("Kuramoto order:", kuramotoOrder(ph));
  const zt = new ZeroTrickMultiplier(3.14);
  const ii = new InfinityIntegrator(1e-3);
  for (let i = 0; i < 1000; i++) ii.step(0.001);
  console.log("zero-trick out:", zt.multiply(999), "integrator state:", ii.state.toFixed(4));
}
