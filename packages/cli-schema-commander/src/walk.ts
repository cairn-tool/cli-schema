import type { Argument, Command, Option } from "commander";
import {
  CONTRACT_VERSION,
  buildUsage,
  type CommandContractRegistry,
  type DescribeResult,
  type DescribedArgument,
  type DescribedCommand,
  type DescribedOption,
  type SchemaRef,
  type AdvisoryOutput,
} from "@cairn-tool/cli-schema";

export interface WalkOptions {
  registry?: CommandContractRegistry;
  advisoryOutput?: AdvisoryOutput;
  schemas?: SchemaRef[];
  formatShorthands?: Record<string, string>;
  isRepeatable?: (option: Option) => boolean;
}

const VALUE_NAME = /[<[]([^>\]]+)[>\]]/;
const FRAMEWORK_OPTION_LONG = new Set(["--help", "--version"]);

function extractValueName(flags: string): string | null {
  const match = VALUE_NAME.exec(flags);
  if (!match) return null;
  return match[1].replace(/\.\.\.$/, "");
}

function defaultIsRepeatable(option: Option): boolean {
  return Boolean(option.variadic);
}

function optionArity(option: Option, repeatable: boolean): DescribedOption["arity"] {
  if (repeatable || option.variadic) {
    if (option.isBoolean()) return { min: 0, max: null };
    return { min: option.required ? 1 : 0, max: null };
  }
  if (option.isBoolean()) return { min: 0, max: 0 };
  if (option.required) return { min: 1, max: 1 };
  if (option.optional) return { min: 0, max: 1 };
  return { min: 0, max: 0 };
}

function optionValueType(option: Option): DescribedOption["valueType"] {
  if (option.argChoices?.length) return "string";
  if (option.isBoolean()) return "boolean";
  if (option.required || option.optional || option.variadic) return "string";
  return "boolean";
}

function describeOption(
  option: Option,
  recursive: boolean,
  isRepeatable: (option: Option) => boolean,
): DescribedOption {
  const name = option.long ?? option.short ?? `--${option.name()}`;
  const aliases: string[] = [];
  if (option.long && option.short) aliases.push(option.short);
  const allowed = option.argChoices?.length ? [...option.argChoices] : null;
  return {
    name,
    aliases,
    description: option.description,
    valueName: extractValueName(option.flags),
    arity: optionArity(option, isRepeatable(option)),
    required: Boolean(option.mandatory),
    negatable: Boolean(option.negate),
    valueType: optionValueType(option),
    allowedValues: allowed,
    recursive,
    ...(option.defaultValue === undefined ? {} : { default: option.defaultValue }),
  };
}

function argumentArity(argument: Argument): DescribedArgument["arity"] {
  if (argument.variadic) return { min: argument.required ? 1 : 0, max: null };
  return { min: argument.required ? 1 : 0, max: argument.required ? 1 : 1 };
}

function describeArgument(argument: Argument): DescribedArgument {
  const allowed = argument.argChoices?.length ? [...argument.argChoices] : null;
  return {
    name: argument.name(),
    description: argument.description,
    arity: argumentArity(argument),
    valueType: "string",
    allowedValues: allowed,
    ...(argument.defaultValue === undefined ? {} : { default: argument.defaultValue }),
  };
}

function visibleChildren(command: Command): Command[] {
  return command
    .createHelp()
    .visibleCommands(command)
    .filter((child) => child.name() !== "help");
}

function visibleOptions(command: Command): Option[] {
  return command.options.filter(
    (option) => !option.hidden && !FRAMEWORK_OPTION_LONG.has(option.long ?? ""),
  );
}

/**
 * Walks the commander tree for the mechanical facts, which cannot drift, and
 * merges the registry for the semantic ones commander cannot know.
 *
 * A command with no registry entry is reported as `undeclared` rather than
 * throwing — a user should not get a crash because a contract row is missing.
 */
export function walkCommands(program: Command, options: WalkOptions = {}): DescribedCommand[] {
  const registry = options.registry ?? {};
  const isRepeatable = options.isRepeatable ?? defaultIsRepeatable;
  const described: DescribedCommand[] = [];
  const visit = (command: Command, path: string[]): void => {
    const children = visibleChildren(command);
    if (path.length) {
      const id = path.join(" ");
      const contract = registry[id];
      const args = command.registeredArguments.map(describeArgument);
      const recursive = children.length > 0;
      const opts = visibleOptions(command).map((option) =>
        describeOption(option, recursive, isRepeatable),
      );
      described.push({
        id,
        path,
        description: command.description(),
        usage: buildUsage(program.name(), path, opts, args),
        arguments: args,
        options: opts,
        subcommands: children.map((child) => [...path, child.name()].join(" ")),
        formats: contract?.formats ? [...contract.formats] : null,
        defaultFormat: contract?.defaultFormat ?? null,
        formatConfigurable: contract?.formatConfigurable ?? false,
        outputSchema: contract?.outputSchema ?? null,
        ...(contract?.jsonlSchema != null ? { jsonlSchema: contract.jsonlSchema } : {}),
        ...(contract?.sarifSchema != null ? { sarifSchema: contract.sarifSchema } : {}),
        exitCodes: contract?.exitCodes ?? [],
        ...(contract?.exitCodePassthrough
          ? { exitCodePassthrough: contract.exitCodePassthrough }
          : {}),
        stream: contract?.stream ?? null,
        writes: contract?.writes ?? null,
        stability: contract?.stability ?? "undeclared",
        ...(contract?.notes ? { notes: contract.notes } : {}),
      });
    }
    for (const child of children) visit(child, [...path, child.name()]);
  };
  visit(program, []);
  return described;
}

export function buildDescription(
  program: Command,
  tool: { name: string; version: string },
  options: WalkOptions = {},
): DescribeResult {
  return {
    schemaVersion: CONTRACT_VERSION,
    tool,
    formatShorthands: options.formatShorthands ?? {},
    ...(options.advisoryOutput ? { advisoryOutput: options.advisoryOutput } : {}),
    schemas: options.schemas ? options.schemas.map((schema) => ({ ...schema })) : [],
    commands: walkCommands(program, options),
  };
}

/** Narrows a description to one command path and its descendants. */
export function selectCommands(result: DescribeResult, path: string[]): DescribeResult {
  const id = path.join(" ");
  const commands = result.commands.filter(
    (command) => command.id === id || command.id.startsWith(`${id} `),
  );
  if (!commands.length) throw new Error(`Unknown command: ${id}`);
  return { ...result, commands };
}
