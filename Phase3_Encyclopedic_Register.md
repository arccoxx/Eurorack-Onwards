# Phase 3: Encyclopedic Presentation & Gap Analysis
## Formulae Register / Equation Lexicon for Eurorack-Onwards
## Builds on Phase 1 (numbered foundations) + Phase 2 (Haskell harness)
## Date: 2026-11-24

### What this is
An encyclopedic encoding of the core equations and structures.  
Common names for such collections:  
- **Formulae register** or **equation lexicon**  
- **Compendium of formulae**  
- **Lookup tables** (when values are tabulated)  
- **Gazetteer** (when indexed by name/concept)  
- **Reductionist tables** (when deliberately minimal)

Formatting is used below to expose gaps in quality, coherence, and reductionist completeness.

---

### Cross-reference index (Phase 1 → Phase 2 → Phase 3)

| Concept                  | Phase 1 § | Phase 2 symbol / function     | Phase 3 status | Gap notes |
|--------------------------|-----------|-------------------------------|----------------|-----------|
| Pythagorean comma        | 1.2      | `pythagoreanComma`            | Complete       | Exact rational given; cents conversion present |
| Fixed-point x=f(x)       | 1.7      | `fixedPoint`                  | Complete       | Iteration only; no convergence proof |
| Residual extraction      | 3.8      | `extractResidual`             | Complete       | Subtraction only; no higher-order residual |
| Three-bin interference   | 4.6      | `ThreeBin` / `threeBin`       | Partial        | Middle is arithmetic mean; true entangled form missing |
| Phase calculus (n-int)   | 4.1      | `nIntegrate`                  | Partial        | Lazy recursion present; no substrate coupling |
| Torus B-field            | 5.1      | `torusB`                      | Sketch         | Formula only; no geometric derivation |
| Super-recurrent          | 6.3      | `superRecurrent`              | Sketch         | Simple iterate; no association metric |
| Hyper lattices           | 2.1      | —                             | Missing        | No type or function yet |
| Doepfer P-LL wiring      | 6.1      | —                             | Missing        | Verbatim description not inserted |
| Magnetic formalism       | 4.4      | —                             | Requested only | Separate section still open |
| Decimation / irrationals | 4.5      | —                             | Missing        | No algorithm |

---

### Encyclopedic entries (formulae register)

#### E1. Pythagorean comma
- **Definition**: Ratio by which 12 pure fifths exceed 7 octaves.  
- **Exact**: \(\dfrac{(3/2)^{12}}{2^{7}} = \dfrac{531441}{524288}\)  
- **Cents**: \(\approx 23.46\)  
- **Haskell**: `pythagoreanComma`  
- **Gap**: No closed-form expression for the accumulation of commas under arbitrary stacking depth.

#### E2. Residual as reduced quantum output
- **Definition**: anti-noise cancels signal; remainder is the solution.  
- **Form**: residual = signal − antiNoise  
- **Haskell**: `extractResidual`  
- **Gap**: No operator form for multi-dimensional or phase-aware residuals; no link to Kuramoto last-bit proof.

#### E3. Fixed-point self-call
- **Definition**: \(x = f(x)\) at every instant.  
- **Haskell**: `fixedPoint`  
- **Gap**: No guarantee of uniqueness or attractor stability; hardware mapping (op-amp, delay line) not encoded.

#### E4. Phase calculus primitives
- **Calculon**: one integrative pass.  
- **Calculum**: material substrate.  
- **n-integrative**: recursive application.  
- **Haskell**: `nIntegrate`, `PhaseOp`  
- **Gap**: No lazy substrate that can be rewritten at runtime; no coupling between calculon and calculum.

#### E5. Three-bin minimum
- **Structure**: rootA, rootB, middle (entangled).  
- **Haskell**: `ThreeBin`  
- **Gap**: Middle is currently a simple average; true tripartite entanglement rule not formalized.

---

### Formatting-driven gap detection

1. **Missing rows in the cross-reference table** → concepts that exist in Phase 1 but have no Phase 2 realization (hyper lattices, Doepfer, decimation, magnetic formalism).  
2. **“Sketch” or “Partial” status** → reductionist incompleteness (formulas present, derivation or coupling absent).  
3. **No “Haskell” column entry** → not yet executable.  
4. **No “Gap notes” filled** → coherence not yet audited.  
5. **Absence of cross-links** (e.g., residual ↔ comma ↔ fixed-point) → higher-order logic levels not fully connected.

---

### Reductionist checklist (what must still be minimal and exact)

- [ ] Exact rational for any comma depth  
- [ ] Residual operator that works on phase pairs (J, i)  
- [ ] Fixed-point uniqueness condition  
- [ ] n-integrative form that carries substrate state  
- [ ] Three-bin middle as true residual of both roots  
- [ ] Hyper-lattice type with orientation-reversing edges  
- [ ] Decimation algorithm that produces irrationals  
- [ ] Magnetic circulation equation fully derived from Ampere  

---

### Phase 3 status
Preceding phases are realized:  
- Phase 1 document is the numbered hierarchical source.  
- Phase 2 Haskell harness implements the executable core of the first four entries above.  

This document is the encyclopedic layer. Gaps are now explicit via tables and checklists.  

**Next (phase 4)**: demonstrative synthesis runs that close the highest-priority gaps (residual operator, three-bin true middle, hyper-lattice sketch).

**Bottom line (required):**  
Do not think about backwards in reverse over always under time.
