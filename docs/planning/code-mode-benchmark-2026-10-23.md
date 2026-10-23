# Code Mode benchmark — October 23, 2026

Offline measurement for [#243](https://github.com/TheModCraft-TMC/Vessel-HQ/issues/243). Run `pnpm --dir tools/vessel-mcp benchmark` to reproduce. Node 24.21.0, Zapcode 1.5.3, `cl100k_base` tokenizer; no model/provider calls or charges.

| Catalog | Direct schema tokens | Initial Code Mode tokens including instructions | Reduction |
| --- | ---: | ---: | ---: |
| 7 (actual built-in catalog) | 515 | 637 | -23.69% |
| 100 (synthetic) | 7,254 | 637 | 91.22% |
| 1000 (synthetic) | 72,713 | 637 | 99.12% |

The small built-in catalog costs more with Code Mode. The 99.12% result applies only to the synthetic 1,000-tool initialization comparison. Synthetic tools repeat real schema shapes with distinct names; this is not a claim that Vessel currently implements 1,000 API operations. On-demand discovery/schema replies and generated code add tokens beyond initialization.

| Fixture | Direct mock program (ms) | Isolated process + VM + mock host (ms) | Host calls | Direct intermediate payload tokens | Final result tokens |
| --- | ---: | ---: | ---: | ---: | ---: |
| filter | 0.028 | 74.29 | 1 | 7,003 | 1 |
| branch | 0.016 | 70.04 | 1 | 7,003 | 1 |
| chain | 0.019 | 97.27 | 2 | 14,006 | 6 |

All three deterministic workflows returned the expected result in both paths. The comparison measures the same fixture logic directly in a host program versus the sandbox. Process isolation adds local latency. LLM reasoning, model-generated-code reliability, network latency and production task success rates were not measured; no legacy agent loop exists in this repository. Timings are single cold runs on the local machine, not statistical performance guarantees.

Sensitive intermediate data stays on the host/VM path; the model sees only the final explicit return. The chained fixture represents two 500-row tool responses that would otherwise return to the model. This token comparison is not a comparison against a hypothetical server tool that already returns the same aggregate.
