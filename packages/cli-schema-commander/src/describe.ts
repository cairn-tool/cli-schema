import type { Command } from "commander";
import { renderText } from "@cairn-tool/cli-schema";
import { buildDescription, selectCommands, type WalkOptions } from "./walk.js";

export const DESCRIBE_FORMATS = ["llm", "human", "json"] as const;
export type DescribeFormat = (typeof DESCRIBE_FORMATS)[number];

export interface AddDescribeCommandOptions extends WalkOptions {
  toolName?: string;
  toolVersion?: string;
}

const HELP_TEXT =
  "\nExamples:\n  describe --format json\n  describe md graph --format json\n\nReports the static contract; project configuration is not applied.\n\nExit codes:\n  0  Description written to stdout\n  1  Unknown command path or invalid format";

/**
 * Registers `describe` on `program`: a `[command...]` argument and `--format`
 * defaulting to `llm`. Unknown formats are a hard error, not a silent substitution.
 */
export function addDescribeCommand(
  program: Command,
  opts: AddDescribeCommandOptions = {},
): Command {
  program
    .command("describe")
    .description("Describe the CLI contract: commands, options, exit codes, and output schemas")
    .argument("[command...]", "Optional command path, for example: md graph")
    .option("--format <fmt>", "Output format: llm, human, json", "llm")
    .addHelpText("after", HELP_TEXT)
    .action((commandPath: string[], parsed: { format: string }) => {
      const format = parsed.format || "llm";
      if (!DESCRIBE_FORMATS.includes(format as DescribeFormat))
        throw new Error(`Invalid output format: ${format}`);
      const full = buildDescription(
        program,
        {
          name: opts.toolName ?? program.name(),
          version: opts.toolVersion ?? program.version() ?? "0.0.0",
        },
        opts,
      );
      const result = commandPath.length ? selectCommands(full, commandPath) : full;
      process.stdout.write(
        format === "json"
          ? JSON.stringify(result, null, 2) + "\n"
          : renderText(result, format === "human"),
      );
    });
  return program;
}
