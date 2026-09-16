export const CONTRACT_VERSION = "1";

export type ContractStream = "stdout" | "stderr";
export type ValueType = "boolean" | "string" | "integer" | "number";
export type Stability = "stable" | "experimental" | "undeclared";

export interface Arity {
  min: number;
  /** `null` is unbounded. */
  max: number | null;
}

export interface ExitCodeMeaning {
  code: number;
  meaning: string;
}

export interface AdvisoryOutput {
  description: string;
  stream: ContractStream;
  suppressedWhen: string[];
  optOutEnv: string;
}

export interface SchemaRef {
  id: string;
  uri: string;
  title: string;
  commands: string[];
}

export interface CommandContract {
  formats: readonly string[] | null;
  defaultFormat: string | null;
  formatConfigurable: boolean;
  outputSchema: string | null;
  jsonlSchema?: string | null;
  sarifSchema?: string | null;
  exitCodes: ExitCodeMeaning[];
  exitCodePassthrough?: { min: number; max: number; description: string };
  stream: { success: ContractStream; findings?: ContractStream } | null;
  writes: boolean | null;
  stability: "stable" | "experimental";
  notes?: string;
}

export type CommandContractRegistry = Record<string, CommandContract>;

export interface DescribedArgument {
  name: string;
  description: string;
  arity: Arity;
  valueType: ValueType | null;
  allowedValues: string[] | null;
  default?: unknown;
}

export interface DescribedOption {
  name: string;
  aliases: string[];
  description: string;
  valueName: string | null;
  arity: Arity;
  required: boolean;
  negatable: boolean;
  valueType: ValueType | null;
  allowedValues: string[] | null;
  recursive: boolean;
  default?: unknown;
}

export interface DescribedCommand {
  id: string;
  path: string[];
  description: string;
  usage: string;
  arguments: DescribedArgument[];
  options: DescribedOption[];
  subcommands: string[];
  formats: string[] | null;
  defaultFormat: string | null;
  formatConfigurable: boolean;
  outputSchema: string | null;
  jsonlSchema?: string | null;
  sarifSchema?: string | null;
  exitCodes: ExitCodeMeaning[];
  exitCodePassthrough?: { min: number; max: number; description: string };
  stream: { success: ContractStream; findings?: ContractStream } | null;
  writes: boolean | null;
  stability: Stability;
  notes?: string;
}

export interface DescribeResult {
  schemaVersion: string;
  tool: { name: string; version: string };
  formatShorthands: Record<string, string>;
  advisoryOutput?: AdvisoryOutput;
  schemas: SchemaRef[];
  commands: DescribedCommand[];
}

export function isRequired(arity: Arity): boolean {
  return arity.min >= 1;
}

export function isVariadic(arity: Arity): boolean {
  return arity.max === null || arity.max > 1;
}
