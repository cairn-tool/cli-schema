# CLI schema

A portable description of a command-line interface: every command, option, argument, exit code, and output schema, produced from the live command tree rather than from `--help` text.

This document is normative. [`v1/cli-schema.json`](v1/cli-schema.json) is the machine-readable half. [`mapping.md`](mapping.md) maps the model onto commander.js and System.CommandLine.

## Identifier and version

The schema `$id` is:

```text
https://github.com/cairn-tool/cli-schema/v1/cli-schema.json
```

It is an identifier, not a fetchable URL. `schemaVersion` is `"1"`. It versions this payload shape and is owned by hand, independent of the npm and NuGet package versions.

## Static contract

`describe` reports the **static** contract. The answer must not depend on the working directory, project configuration, or runtime environment. A consumer running the same binary twice gets the same description.

## Unknown properties

No schema in this specification sets `additionalProperties: false`. Consumers **must** ignore properties they do not recognize. Adding a property is a non-breaking change.

## Envelope

| Field              | Required | Notes                                                                                                                                 |
| ------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `schemaVersion`    | yes      | `"1"`                                                                                                                                 |
| `tool`             | yes      | `{ name, version }`                                                                                                                   |
| `formatShorthands` | yes      | argv token to the `--format` value it expands to. Empty object when the tool has none.                                                |
| `advisoryOutput`   | no       | Machine-stream guarantees for an advisory notice (update notifier, telemetry). **Omitted** when the tool has none — never fabricated. |
| `schemas`          | yes      | Published output schemas. Empty array when none.                                                                                      |
| `commands`         | yes      | Every visible command except the implicit root.                                                                                       |

`advisoryOutput`, when present:

| Field            | Notes                                       |
| ---------------- | ------------------------------------------- |
| `description`    | What the notice is.                         |
| `stream`         | Where it is written (`stdout` or `stderr`). |
| `suppressedWhen` | Conditions under which it is not written.   |
| `optOutEnv`      | Environment variable that disables it.      |

## Command

| Field                 | Required | Notes                                                                                    |
| --------------------- | -------- | ---------------------------------------------------------------------------------------- |
| `id`                  | yes      | Space-joined path, e.g. `"md graph"`.                                                    |
| `path`                | yes      | Path segments.                                                                           |
| `description`         | yes      |                                                                                          |
| `usage`               | yes      | Spec-defined; see [Usage](#usage).                                                       |
| `arguments`           | yes      |                                                                                          |
| `options`             | yes      | Locally registered, non-hidden options. Framework help and version options are excluded. |
| `subcommands`         | yes      | Visible child ids. Hidden commands and the implicit `help` subcommand are excluded.      |
| `formats`             | yes      | Accepted `--format` values, or `null` when the command has no output format.             |
| `defaultFormat`       | yes      | Built-in default, or `null`.                                                             |
| `formatConfigurable`  | yes      | Whether project configuration may override the format.                                   |
| `outputSchema`        | yes      | Schema id for `--format json`, or `null`.                                                |
| `jsonlSchema`         | no       | Schema id for `--format jsonl`.                                                          |
| `sarifSchema`         | no       | Schema URI for `--format sarif`.                                                         |
| `exitCodes`           | yes      | Integer codes this tool decides itself. Empty when undeclared.                           |
| `exitCodePassthrough` | no       | Present only when a child process's status is forwarded verbatim.                        |
| `stream`              | yes      | `{ success, findings? }` or `null` when undeclared.                                      |
| `writes`              | yes      | Whether the command may modify files, or `null` when undeclared.                         |
| `stability`           | yes      | `"stable"`, `"experimental"`, or `"undeclared"`.                                         |
| `notes`               | no       | Behavior a consumer would otherwise be surprised by.                                     |

A command with no registry entry is **undeclared**, not an error: `stability` is `"undeclared"`, `formats` / `defaultFormat` / `outputSchema` / `stream` / `writes` are `null`, `formatConfigurable` is `false`, `exitCodes` is `[]`. A missing row must not crash a user.

`exitCodes[].code` is an integer. 0/1/2 is a house rule some tools adopt; it is not required.

## Option

| Field           | Required | Notes                                                                     |
| --------------- | -------- | ------------------------------------------------------------------------- |
| `name`          | yes      | Canonical token **with its prefix**, e.g. `"--format"`.                   |
| `aliases`       | yes      | Other tokens, each with its prefix. Does not include `name`.              |
| `description`   | yes      |                                                                           |
| `valueName`     | yes      | Metavariable (`"fmt"`), or `null` for a flag. Trailing `...` is stripped. |
| `arity`         | yes      | `{ min, max }`. `max: null` is unbounded.                                 |
| `required`      | yes      | The option itself must be present (not "a value is required").            |
| `negatable`     | yes      | Whether `--no-<name>` is also legal. Default `false`.                     |
| `valueType`     | yes      | See [Value types](#value-types).                                          |
| `allowedValues` | yes      | Closed set of tokens, or `null`.                                          |
| `recursive`     | yes      | Legal when invoking a subcommand.                                         |
| `default`       | no       | Omitted when the framework reports no explicit default.                   |

## Argument

| Field           | Required | Notes                                                   |
| --------------- | -------- | ------------------------------------------------------- |
| `name`          | yes      | Without brackets or ellipsis.                           |
| `description`   | yes      |                                                         |
| `arity`         | yes      | `{ min, max }`. `max: null` is unbounded.               |
| `valueType`     | yes      | See [Value types](#value-types).                        |
| `allowedValues` | yes      | Closed set of tokens, or `null`.                        |
| `default`       | no       | Omitted when the framework reports no explicit default. |

There are no `required` or `variadic` fields on arguments. Both are functions of arity:

- required ⇔ `min >= 1`
- variadic ⇔ `max === null` or `max > 1`

## Value types

`valueType` is one of `"boolean"`, `"string"`, `"integer"`, `"number"`, or `null` when the emitter cannot state a portable type.

Enums are `"string"` (or `"integer"` when the .NET enum is numeric-only, with no useful names) plus `allowedValues`. Mapping from each framework is in [`mapping.md`](mapping.md).

## Usage

`usage` is a pure function of the rest of the command. Neither emitter may use a framework-supplied usage string.

Algorithm, given tool name `T`, path segments `P`, the command's options, and its arguments in order:

1. Start with `T`, then each segment of `P`, joined by a single space.
2. If the command has any options, append ` [options]`.
3. For each argument:
   - variadic and required: append ` <name...>`
   - variadic and not required: append ` [name...]`
   - not variadic and required: append ` <name>`
   - not variadic and not required: append ` [name]`

Example: `demo run [options] <script> [args...]`.

## Text rendering

`llm` and `human` formats share one renderer. `human` wraps the command id in ANSI bold (`\x1b[1m` … `\x1b[0m`) and an undeclared-contract marker in dim (`\x1b[2m` … `\x1b[0m`). `llm` is the same text without those sequences. Both emitters must produce character-identical output for the same payload.

## Conformance

Each case under [`conformance/`](conformance/) has a hand-written `expected.json`. An emitter builds the equivalent CLI in its own framework and asserts its payload matches after:

1. Parsing both documents.
2. Removing `tool.version` (binaries report their own).
3. Canonicalizing key order to match this document and emitting JSON with 2-space indent and `\n` newlines.

The `.NET` arity fixture omits the commander-only negation command; see [`conformance/arity/README.md`](conformance/arity/README.md).
