# cli-schema

A portable description of a command-line interface, plus emitters that produce the same payload from a live command tree.

The **model packages** (`@cairn-tool/cli-schema`, `CairnTool.CliSchema`) hold the types, JSON Schema, `buildUsage` / `UsageBuilder`, `renderText` / `TextRenderer`, and a validator. They have **no** commander or System.CommandLine dependency.

The **emitter packages** (`@cairn-tool/cli-schema-commander`, `CairnTool.CliSchema.SystemCommandLine`) walk a live CLI and depend on the matching framework plus the model package.

The specification is [`spec/README.md`](spec/README.md). The JSON Schema is [`spec/v1/cli-schema.json`](spec/v1/cli-schema.json). Both emitters are held in agreement by the goldens under [`spec/conformance/`](spec/conformance/).

## Install

Models only:

```bash
npm install @cairn-tool/cli-schema
```

```xml
<PackageReference Include="CairnTool.CliSchema" Version="1.0.0" />
```

commander.js emitter (brings the model package with it):

```bash
npm install @cairn-tool/cli-schema-commander
```

System.CommandLine emitter (brings `CairnTool.CliSchema` with it; depends on System.CommandLine `[2.0.12,3.0.0)`):

```xml
<PackageReference Include="CairnTool.CliSchema.SystemCommandLine" Version="1.0.0" />
```

## Models

```js
import { validate, cliSchema, buildUsage, renderText } from "@cairn-tool/cli-schema";
```

```csharp
using CairnTool.CliSchema;

var document = Schema.Json;          // JSON Schema 2020-12
var version = Schema.Version;        // "1"
```

## commander.js

```js
import { Command } from "commander";
import { addDescribeCommand } from "@cairn-tool/cli-schema-commander";

const program = new Command("demo");
program.command("greet").option("-n, --name <name>", "Who to greet");

addDescribeCommand(program, {
  toolName: "demo",
  toolVersion: "1.0.0",
  registry: {
    greet: {
      formats: ["llm", "human", "json"],
      defaultFormat: "llm",
      formatConfigurable: false,
      outputSchema: null,
      exitCodes: [{ code: 0, meaning: "Wrote the greeting" }],
      stream: { success: "stdout" },
      writes: false,
      stability: "stable",
    },
  },
});

await program.parseAsync();
```

```bash
demo describe --format json
demo describe greet --format llm
```

Unknown `--format` values are a hard error, not a silent substitution. A command with no registry row is reported as `undeclared` rather than throwing.

`registry`, `advisoryOutput`, `schemas`, `formatShorthands`, and `isRepeatable` are all injectable. A tool without an advisory notice omits the key.

## System.CommandLine

```csharp
using System.CommandLine;
using CairnTool.CliSchema;
using CairnTool.CliSchema.SystemCommandLine;

var root = new RootCommand("Kitchen Production System CLI");
root
    .AddSnapshotCommand()
    .AddDescribeCommand(
        new ContractRegistry().Add("snapshot list", new CommandContract(
            Formats: ["json"],
            DefaultFormat: "json",
            FormatConfigurable: false,
            OutputSchema: "snapshot-list",
            ExitCodes: [new ExitCodeMeaning(0, "Listed snapshots")],
            Stream: new CommandStream("stdout"),
            Writes: false,
            Stability: "stable")),
        new DescribeCommandOptions { ToolName = "kps-cli", ToolVersion = "1.0.0" });

return await root.Parse(args).InvokeAsync();
```

`AddDescribeCommand` uses `new Option<T>("--format")`, `Aliases.Add`, `DefaultValueFactory`, and `SetAction` — the same idiom as the rest of a KPS CLI — and returns the parent so it chains.

## Conformance

```bash
npm ci && npm run lint && npm run typecheck && npm test
dotnet test dotnet/CliSchema.slnx
npm run conformance
```

`npm run conformance` validates both emitters against `spec/v1/cli-schema.json` and diffs them against every `spec/conformance/*/expected.json`.

## License

MIT
