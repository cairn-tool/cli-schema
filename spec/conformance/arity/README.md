The .NET arity fixture does not register a `--no-x` option. System.CommandLine 2.0.12 has no negation equivalent, so `negatable` is always `false` and inventing a command just to match commander would hide that gap.

The commander fixture registers `negate` with `--no-config`. The shared [`expected.json`](expected.json) includes that command. When the conformance runner diffs a .NET payload, it removes the command whose `id` is `negate` from the golden first.
