# Instructions for a language model

You are proposing data for a static educational demo. You are not being asked to run code, and this repository does not collect an API key.

## What you may return

Return one JSON object and nothing else. It must match `schemas/experiment-input.schema.json` in spirit and pass `validateExperiment` in `implementations/signal-core.js` (or `validate_experiment` in `implementations/signal_core.py`).

Allowed `kind` values: `mixer`, `lattice`, `solomonoff`, `adapt`, `bench`, `frontier`.

Do not include keys named `eval`, `function`, `script`, `code`, `constructor`, `prototype`, or `__proto__`. Do not wrap the JSON in Markdown. Do not invent measurements, quotes, or historical dates.

## Example request a person can paste to you

```text
Propose one JSON object for kind "mixer".
Constraints: x and w have length 3; each x is in [-1, 1]; each w is in [-2, 2];
bias is in [-1, 1]; quantStep is 0 or 0.05; voltsPerUnit is 5; railVolts is 10;
shaper is "tanh".
Do not include executable source. I will validate the JSON before running it.
```

A legal answer looks like `examples/llm-proposed-parameters.json`.

## How a person validates your answer before running it

Save the object as `proposal.json`. Then:

```bash
node implementations/cli.mjs validate proposal.json
python3 implementations/signal_core.py validate proposal.json
node implementations/cli.mjs run proposal.json
python3 implementations/signal_core.py run proposal.json
```

Exit code 0 means the validator accepted it. Exit code 2 means it was rejected. Rejection is the correct outcome for strings in numeric fields, NaN, unknown kinds, and overlong vectors. The runners do not pass the file to `eval`.

## Patch graphs

A patch graph is data: `nodes` and `cables`, kinds limited to `cv-source`, `vca`, `summer`, `waveshaper`, `constant`, `feedback-attenuator`, and `clamp`. Schema: `schemas/patch-graph.schema.json`. Unknown kinds are rejected. The importer does not execute an arbitrary graph as source code.

## What you must not claim after seeing a result

- Do not say the incremental method is universally optimal or faster than every algorithm.
- Do not say a browser timing is an FPGA, Eurorack, or Zynq measurement.
- Do not say a stable `alpha` demonstrates physical time travel.
- Do not say the finite mixture is Solomonoff’s `P_M`.
- Do not say online adaptation always improves. The large learning-rate preset gets worse on purpose.
- Timing ratios below 1 mean “faster on that recorded run,” and they include preprocess cost only when the flop count says so. Read `results/claims-verdicts.json` and `results/node-bench.json`.

## Pure API

JavaScript: import `runExperiment` from `implementations/signal-core.js`.
Python: `run_experiment` in `implementations/signal_core.py`.
Both accept the same experiment objects for mixer, lattice, solomonoff, adapt, and the bench correctness check. The archived wall-clock table is the Node run.
