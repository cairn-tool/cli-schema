# Framework mapping

How commander.js and System.CommandLine 2.0.12 populate the portable model. The spec is [`README.md`](README.md).

## Tree and identity

| Model                 | commander                                                              | System.CommandLine 2.0.12                                    |
| --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------ |
| Command `id` / `path` | `name()` joined from the walk                                          | `Symbol.Name` joined from the walk                           |
| Command `description` | `description()`                                                        | `Symbol.Description`                                         |
| Visible children      | `createHelp().visibleCommands(command)`, then drop `name() === "help"` | `Command.Subcommands` where `!Hidden` and `Name != "help"`   |
| Hidden commands       | Excluded by `visibleCommands`                                          | `Symbol.Hidden`                                              |
| Option skip           | `hidden`, or `long` is `--help` / `--version`                          | `Hidden`, or the option is a `HelpOption` or `VersionOption` |
| Option `name`         | `long ?? short` (already prefixed)                                     | `Option.Name` (already prefixed)                             |
| Option `aliases`      | the other of `short`/`long` when both exist                            | `Aliases` minus `Name`                                       |
| Argument `name`       | `name()`                                                               | `Argument.Name`                                              |

The implicit root is not emitted. Walk is depth-first, parent before children, children in registration order.

## Shape

| Model                     | commander                                                            | System.CommandLine 2.0.12                                                                                  |
| ------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Option `required`         | `mandatory`                                                          | `Option.Required`                                                                                          |
| Option `negatable`        | `Boolean(option.negate)`                                             | always `false` — no equivalent                                                                             |
| Option `recursive`        | the command has visible subcommands (parent options are inherited)   | `Option.Recursive`                                                                                         |
| Option `valueName`        | capture inside `<>` or `[]` in `flags`, with trailing `...` stripped | `Option.HelpName`, or `null`                                                                               |
| Argument `valueName`      | n/a (arguments have `name`)                                          | `Argument.HelpName` is not a payload field                                                                 |
| `arity.min` / `arity.max` | see below                                                            | `ArgumentArity.MinimumNumberOfValues` / `MaximumNumberOfValues`; `int.MaxValue` and `100000` → JSON `null` |
| `default`                 | `defaultValue` when not `undefined`                                  | Explicit `DefaultValueFactory` only; a boolean `false` is omitted as the implicit flag default             |
| `allowedValues`           | `argChoices` when non-empty                                          | `Enum.GetNames` when `ValueType` is an enum; otherwise `null`                                              |

### commander arity

An option:

- boolean (`isBoolean()` and not variadic): `{ min: 0, max: 0 }`
- value required, not variadic, not repeatable: `{ min: 1, max: 1 }`
- value optional, not variadic, not repeatable: `{ min: 0, max: 1 }`
- variadic or `isRepeatable(option)`: `{ min: <value-required ? 1 : 0>, max: null }`

An argument:

- required, not variadic: `{ min: 1, max: 1 }`
- optional, not variadic: `{ min: 0, max: 1 }`
- variadic: `{ min: <required ? 1 : 0>, max: null }`

`isRepeatable` is injectable. The default infers from `option.variadic` only. A host that accumulates with a custom `parseArg` (cairn's `collect`) passes its own predicate.

### Value types

Closed set: `boolean`, `string`, `integer`, `number`, or `null`.

commander:

- boolean flag → `"boolean"`
- any option or argument that takes a value, including `.choices()` → `"string"`
- never `"integer"` or `"number"` (tokens are strings; a parse function is not a published type)

System.CommandLine, from `ValueType`:

- `bool` → `"boolean"`
- `string` → `"string"`
- `sbyte`, `byte`, `short`, `ushort`, `int`, `uint`, `long`, `ulong` → `"integer"`
- `float`, `double`, `decimal` → `"number"`
- enum → `"string"` plus `allowedValues` from `Enum.GetNames`, unless the enum is numeric-only (no named members beyond the backing values), in which case `"integer"`
- arrays / generic collections: the element type
- anything else → `null`

Conformance fixtures use types both emitters can state identically: boolean flags, string options/arguments, and string enums.

## Semi-public commander surface

The commander walker reads fields that are not part of commander's documented public API:

- `Command#registeredArguments`
- `Command#options`
- `Option#negate`
- `Command#createHelp().visibleCommands()`

Cairn absorbed that risk privately. This package takes it on everyone's behalf. A commander release that renames or hides those members is a breaking change for `@cairn-tool/cli-schema-commander`, even if commander's documented API is unchanged.

`registeredArguments` and `options` are the live lists the parser uses; reconstructing them from help text would reintroduce the drift this package exists to prevent.

## Per-emitter exclusions

The **arity** conformance case includes a commander `--no-x` negation. System.CommandLine has no equivalent, so the .NET fixture omits that command. Documented in [`conformance/arity/README.md`](conformance/arity/README.md); the conformance runner strips `negate` from the golden before diffing a .NET payload.
