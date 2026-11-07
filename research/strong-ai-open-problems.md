# Strong AI notes that stay inside the sources checked

This is not a leaderboard and not a claim that current systems are or are not “strong AI.” No private benchmark score is reported.

## Sources actually identified

| Source | What was confirmed |
|---|---|
| Wei et al., “Emergent Abilities of Large Language Models,” https://arxiv.org/abs/2206.07682 | Title and abstract page fetched 2026-11-06. Emergence is defined there as an ability absent in smaller models and present in larger ones, so it is not read off a smooth scaling curve. |
| Dominguez-Olmedo, Dorner, and Hardt, “Training on the Test Task Confounds Evaluation and Emergence,” ICLR 2025, preprint https://arxiv.org/abs/2407.07890 | Title confirmed from the ICLR abstract page and the arXiv abs page. The paper’s point, from those abstracts, is that task-relevant pretraining confounds model comparisons and some emergence claims. |
| “Evaluation data contamination in LLMs: how do we measure it and (when) does it matter?” HTML title from the t472 arXiv save for 2411.03923 | Contamination measurement is an open evaluation problem. The HTML was not republished. |
| “Predicting Emergent Capabilities by Finetuning,” HTML title from the t472 save for 2411.16035 | Predicting capabilities before they leave chance is treated as unsolved in that line of work. The HTML was not republished. |

An arXiv id mentioned in passing in the t472 note (2602.12413) was not re-checked and is omitted.

## Open problems worth keeping on the list

These are research problems, not a marketing ladder:

1. Generalization under shift when benchmarks may share task data with training.
2. An account of in-context learning whose traces match the computation, not only the final answer.
3. World models that support intervention rather than correlation alone.
4. Long-horizon agency with stable goals and corrigibility.
5. End-to-end formal properties at the scale of current language models.
6. Calibration under pressure to agree.
7. Predicting downstream ability before it appears.
8. Continuous control tied to perception, with explicit safety constraints.
9. Continual update without silent overwrite of the record. See the generic knowledge-graph note.
10. Resource-bounded induction that does not pretend to compute Solomonoff’s universal mixture.

There is no single difficulty order of “all of intelligence” analogous to a complete map of mathematics. Perplexity, question answering, grade-school math, code, and long-horizon tools are different instruments.

## Not claimed

Benchmark rank is not solved intelligence. “Unanticipated” behavior is compatible with recombination of training text. This demo’s adaptation trace is a three-weight tanh fit. It is not an LLM.
