# META-HANDOFF

Portable context for the next chat. No hidden task state is required beyond this file, the git history, and the paths it names.

## What the user authorized

Public additive work on https://github.com/arccoxx/Eurorack-Onwards. Keep the repository public. Do not delete existing content. Do not rewrite history. Do not touch private supersystem recovery. README changes are append-only. A branch and pull request are the delivery path. GitHub Pages is requested. If Pages cannot be turned on, report the exact error and do not invent a live URL.

Parent commit that must remain reachable: `2d035c5dbe386484960a1da56dbeaaca070f967f` (CTC round on main at the start of this work).

## Where the inputs came from

Three gzip archives were extracted into one staging directory. They form one t481 transfer of t472 research plus t479 community handoff notes. `README-START-HERE.md` in that transfer said: overnight Python simulations were **not** implemented, the HTML seeds were **untested**, Pages did not exist, and bulk mirrors were owner-only review.

This session did not publish the mirrors, diagnostics, credentials, or proprietary ledger paths. The audit is `research/SOURCE-INVENTORY.md`.

## Chronology

Folder name `awesome-ai-symposium-synthesis-1954` is a brand label. The archived proposal PDF prints August 31, 1955 (hash in `research/SNAPSHOT-HASHES.md`). The workshop was summer 1956. Weaver is not a 1955 proposal co-author in these notes.

## What was built

| Path | Role |
|---|---|
| `awesome-ai-symposium-synthesis-1954/index.html` | Interactive page: mixer, lattice, finite mixture, adaptation, timing |
| `awesome-ai-symposium-synthesis-1954/implementations/signal-core.js` | Pure JS API, browser and Node |
| `awesome-ai-symposium-synthesis-1954/implementations/signal_core.py` | Python API and CLI |
| `awesome-ai-symposium-synthesis-1954/implementations/cli.mjs` | Node CLI |
| `awesome-ai-symposium-synthesis-1954/schemas/` | Input, result, and patch-graph schemas |
| `awesome-ai-symposium-synthesis-1954/docs/llms.md` and `llms.txt` | How an LLM should propose JSON and how to validate it |
| `awesome-ai-symposium-synthesis-1954/modules/`, `circuits/`, `patches/` | CV range, rails, stability, cable notes |
| `awesome-ai-symposium-synthesis-1954/claims/preregistered-claims.json` | Claims fixed before the passing test run |
| `awesome-ai-symposium-synthesis-1954/results/` | Verdicts and the Node timing log |
| `awesome-ai-symposium-synthesis-1954/seeds/` | Old untested HTML. Not the implementation. |
| `research/` | Releasable findings, 42 art-metadata records, Zynq table, synthetic graph |
| `index.html`, `.nojekyll` | Pages landing at the repo root, Jekyll disabled |

CTC language means computational feedback. Solomonoff’s universal mixture is not computed. The finite toy sets `universal: false`.

## How to run

```bash
cd awesome-ai-symposium-synthesis-1954
node tests/run-all.mjs
python3 tests/test_signal_core.py
node implementations/cli.mjs validate examples/mixer-ideal.json
python3 implementations/signal_core.py run examples/llm-proposed-parameters.json
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/awesome-ai-symposium-synthesis-1954/?preset=quant` from the repo root, or port 8765 inside the folder.

Invalid inputs are rejected. There is no `eval` of imported JSON.

## Archived measurement (do not inflate)

Node v22.23.4, linux x64, from `results/node-bench.json` after `tests/run-all.mjs`:

- Task: 256-vector dot product, 2,000 single-coordinate edits, seed 7. Warmup 2, repeats 7, median and MAD.
- Absolute error versus full recompute: about 2.0×10⁻¹⁵. Budget was 1×10⁻⁶.
- Flops: incremental 6,512 including a 512-flop preprocess. Recompute 1,024,000.
- State: 2,056 bytes for the vector plus the scalar.
- Median time: incremental 0.1288 ms (MAD 0.0024 ms) versus recompute 1.0037 ms (MAD 0.0022 ms). Ratio 0.128.
- One of the seven incremental samples was 0.311 ms. The median is the reported figure.
- Q=1: incremental flops 515 versus recompute 512. Preprocess makes a single edit slightly more arithmetic. Wall-clock at that size is microseconds and is not a speedup claim.

Closed form versus iteration is only for the unclamped affine map `x ← (1−α)c + αx`. The clamped lattice test marks the closed form inapplicable. No asymptotic lower bound is claimed. The browser is CPU software.

Adaptation: learning rate 0.35 reduced squared error on the fixed sequence (about 0.258 to about 0.0024). Learning rate 8 increased it (about 0.039 to about 1.135). Freeze holds weights. Reset restores the initial weight on that step.

## Pages and git

Hosting was not configured at the start (`has_pages` false, Pages API 404). The intended project URL shape is `https://arccoxx.github.io/Eurorack-Onwards/awesome-ai-symposium-synthesis-1954/`. Two create-Pages calls on 2026-11-06, after this branch was pushed, both returned HTTP 403 `Resource not accessible by integration`: one with the GitHub CLI token, and one with the same credential that pushed the branch. No live Pages URL is claimed. A branch link is not hosting. An admin can set the source to this branch (path `/`) or to `main` after merge, then check HTTP 200 on the demo before calling it live. The URL shape, only after that check, would be `https://arccoxx.github.io/Eurorack-Onwards/awesome-ai-symposium-synthesis-1954/`.

## Gaps still open

- Per-paper Solomonoff simulators: planned (`research/planned-simulations.json`).
- Shannon entropy demo, Rochester Hebbian net, More prover, McCarthy lisp toy, parallel-history script: not written.
- ConceptNet: not fetched. Graph is synthetic.
- Alveo bandwidth: not quoted. No board was measured.
- Xbox “non-hot-swap writing” thesis: unknown.
- Physical Eurorack and Zynq runs: not done.
- Seeds: still untested sketches.
- Art grid: 42 metadata rows, no full text, vitality table is not a measurement.

## Deltas versus the transfer

The transfer’s public-candidate set was 15 files of notes and untested seeds. This branch adds runnable code, tests, diagrams, and prose. It does not delete the CTC files. README additions sit between the HTML comments `SYMPOSIUM-SYNTHESIS-1954-APPEND-BEGIN` and `SYMPOSIUM-SYNTHESIS-1954-APPEND-END`.
