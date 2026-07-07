# Benchmark Methodology

Benchmarks are planned after the Codex prompt and skill loop is useful.

The benchmark suite should use fixture diffs rather than live agent calls at first. This keeps results reproducible and avoids requiring API keys or hosted services.

Initial metrics:

- files changed
- lines changed
- files outside scope
- sensitive files touched
- possible secrets introduced
- critical paths changed without test updates
- blocked path violations
- risk score

Benchmark results should be generated as Markdown and JSON so they can compare prompt/skill workflows and remain reviewable in the CLI.
