/*
 * GENERATED FILE -- do not edit.
 *
 * Produced from spec/v1/cli-schema.json by `npm run codegen`. Edit the spec, then regenerate;
 * `npm run codegen:check` fails CI when the two have drifted.
 */
export type ValueType = "boolean" | "string" | "integer" | "number" | null;
export type CommandStream = {
  success: "stdout" | "stderr";
  findings?: "stdout" | "stderr";
} | null;

/**
 * The static contract of a command-line interface. Project configuration is not applied. Consumers must ignore properties they do not recognize.
 */
export interface DescribeResult {
  schemaVersion: string;
  tool: ToolInfo;
  /**
   * argv token to the --format value it expands to before parsing.
   */
  formatShorthands: {
    [k: string]: string;
  };
  advisoryOutput?: AdvisoryOutput;
  schemas: SchemaRef[];
  commands: DescribedCommand[];
}
export interface ToolInfo {
  name: string;
  version: string;
}
/**
 * Machine-stream guarantees for an advisory notice. Omitted when the tool has none.
 */
export interface AdvisoryOutput {
  description: string;
  stream: "stdout" | "stderr";
  suppressedWhen: string[];
  optOutEnv: string;
}
export interface SchemaRef {
  id: string;
  uri: string;
  title: string;
  commands: string[];
}
export interface DescribedCommand {
  /**
   * Space-joined command path, e.g. 'md graph'.
   */
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
  exitCodePassthrough?: ExitCodePassthrough;
  stream: CommandStream;
  writes: boolean | null;
  stability: "stable" | "experimental" | "undeclared";
  notes?: string;
}
export interface DescribedArgument {
  name: string;
  description: string;
  arity: Arity;
  valueType: ValueType;
  allowedValues: string[] | null;
  default?: unknown;
}
export interface Arity {
  min: number;
  max: number | null;
}
export interface DescribedOption {
  name: string;
  aliases: string[];
  description: string;
  valueName: string | null;
  arity: Arity;
  required: boolean;
  negatable: boolean;
  valueType: ValueType;
  allowedValues: string[] | null;
  recursive: boolean;
  default?: unknown;
}
export interface ExitCodeMeaning {
  code: number;
  meaning: string;
}
/**
 * Present only when the command forwards a child process's exit status verbatim.
 */
export interface ExitCodePassthrough {
  min: number;
  max: number;
  description: string;
}
export interface CommandContract {
  formats: string[] | null;
  defaultFormat: string | null;
  formatConfigurable: boolean;
  outputSchema: string | null;
  jsonlSchema?: string | null;
  sarifSchema?: string | null;
  exitCodes: ExitCodeMeaning[];
  exitCodePassthrough?: ExitCodePassthrough;
  stream: CommandStream;
  writes: boolean | null;
  /**
   * Deliberately narrower than a command's. `undeclared` is what an emitter assigns to a command with no contract, so it is never a value a host declares.
   */
  stability: "stable" | "experimental";
  notes?: string;
}
