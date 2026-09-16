import type { DescribeResult, DescribedCommand } from "./types.js";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RESET = "\x1b[0m";

function renderCommand(command: DescribedCommand, human: boolean): string[] {
  const name = human ? `${BOLD}${command.id}${RESET}` : command.id;
  const lines = [name, `  ${command.description}`, `  usage: ${command.usage}`];
  if (command.formats?.length)
    lines.push(`  formats: ${command.formats.join(", ")} (default ${command.defaultFormat})`);
  if (command.outputSchema) lines.push(`  json schema: ${command.outputSchema}`);
  if (command.jsonlSchema) lines.push(`  jsonl schema: ${command.jsonlSchema}`);
  if (command.stream)
    lines.push(
      `  stream: ${command.stream.success} on success` +
        (command.stream.findings ? `, ${command.stream.findings} on findings` : ""),
    );
  if (command.writes) lines.push("  writes: may modify files");
  for (const exit of command.exitCodes) lines.push(`  exit ${exit.code}: ${exit.meaning}`);
  if (command.stability === "undeclared")
    lines.push(human ? `  ${DIM}contract: undeclared${RESET}` : "  contract: undeclared");
  if (command.notes) lines.push(`  note: ${command.notes}`);
  return lines;
}

/** `llm` and `human` share one renderer; `human` adds ANSI bold and dim. */
export function renderText(result: DescribeResult, human: boolean): string {
  const lines = [
    `${result.tool.name} ${result.tool.version}`,
    `contract schema version: ${result.schemaVersion}`,
    `format shorthands: ${Object.entries(result.formatShorthands)
      .map(([flag, value]) => `${flag} = ${value}`)
      .join(", ")}`,
  ];
  if (result.advisoryOutput) {
    lines.push(
      "",
      `update notice: ${result.advisoryOutput.description}`,
      ...result.advisoryOutput.suppressedWhen.map((condition) => `  suppressed when ${condition}`),
    );
  }
  lines.push("", `commands (${result.commands.length}):`, "");
  for (const command of result.commands) lines.push(...renderCommand(command, human), "");
  return lines.join("\n").trimEnd() + "\n";
}
