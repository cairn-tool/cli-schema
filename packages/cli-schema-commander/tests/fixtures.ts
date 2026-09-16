import { Command, Option } from "commander";
import type { AdvisoryOutput, CommandContractRegistry, SchemaRef } from "@cairn-tool/cli-schema";
import type { WalkOptions } from "../src/walk.js";

export const TOOL = { name: "demo", version: "0.0.0" } as const;

export function minimalProgram(): Command {
  const program = new Command("demo");
  program.command("greet").description("Say hello").option("-n, --name <name>", "Who to greet");
  return program;
}

export function nestedProgram(): Command {
  const program = new Command("demo");
  const alpha = program
    .command("alpha")
    .description("First level")
    .option("--global <value>", "Applies to subcommands");
  const beta = alpha.command("beta").description("Second level");
  beta.command("gamma").description("Third level").option("--local <value>", "Only on gamma");
  alpha.command("secret", { hidden: true }).description("Hidden");
  return program;
}

export function arityProgram(includeNegate = true): Command {
  const program = new Command("demo");
  program.command("flag").description("A boolean flag").option("-v, --verbose", "Be loud");
  program
    .command("value")
    .description("A single-value option")
    .addOption(new Option("--output <path>", "Output path").default("out.txt"));
  program
    .command("variadic")
    .description("A variadic argument")
    .argument("[files...]", "Input files");
  program.command("repeat").description("A repeatable option").option("--tag <tag...>", "A tag");
  program
    .command("enum")
    .description("An option with allowed values")
    .addOption(new Option("--format <fmt>", "Output format").choices(["Json", "Text"]));
  if (includeNegate) {
    program
      .command("negate")
      .description("A negated boolean option")
      .addOption(new Option("--no-config", "Disable config"));
  }
  return program;
}

const CONTRACT_REGISTRY: CommandContractRegistry = {
  run: {
    formats: ["llm", "human", "json"],
    defaultFormat: "llm",
    formatConfigurable: true,
    outputSchema: "run-result",
    jsonlSchema: "run-record",
    sarifSchema: "https://json.schemastore.org/sarif-2.1.0.json",
    exitCodes: [
      { code: 0, meaning: "Success" },
      { code: 1, meaning: "Invocation error" },
      { code: 2, meaning: "Findings" },
    ],
    exitCodePassthrough: {
      min: 0,
      max: 255,
      description: "Forwards the child process exit status.",
    },
    stream: { success: "stdout", findings: "stderr" },
    writes: true,
    stability: "stable",
    notes: "Writes a report to --output when set.",
  },
};

const ADVISORY: AdvisoryOutput = {
  description: "The update notice is advisory only and never appears on a machine-readable stream.",
  stream: "stderr",
  suppressedWhen: ["DEMO_NO_NOTICE=1", "CI is set"],
  optOutEnv: "DEMO_NO_NOTICE",
};

const SCHEMAS: SchemaRef[] = [
  {
    id: "run-result",
    uri: "https://example.invalid/run-result.json",
    title: "Run result",
    commands: ["run"],
  },
];

export function contractProgram(): Command {
  const program = new Command("demo");
  program
    .command("run")
    .description("Run a script")
    .argument("<script>", "Script to run")
    .argument("[args...]", "Arguments forwarded to the script")
    .option("-o, --output <path>", "Write a report here");
  program
    .command("group")
    .description("A group of commands")
    .command("leaf")
    .description("A leaf under an undeclared group");
  return program;
}

export function contractWalkOptions(): WalkOptions {
  return {
    registry: CONTRACT_REGISTRY,
    advisoryOutput: ADVISORY,
    schemas: SCHEMAS,
    formatShorthands: { "-fj": "--format=json" },
  };
}
