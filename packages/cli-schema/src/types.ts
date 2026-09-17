/**
 * The public model surface.
 *
 * Every shape is generated from `spec/v1/cli-schema.json` and re-exported here. What stays
 * hand-written is what the spec does not describe as a shape: the contract version, the three
 * string-union aliases the payload uses at its leaves, the registry map a host builds, and two
 * predicates over arity.
 */
export type {
  Arity,
  AdvisoryOutput,
  CommandContract,
  CommandStream,
  DescribeResult,
  DescribedArgument,
  DescribedCommand,
  DescribedOption,
  ExitCodeMeaning,
  ExitCodePassthrough,
  SchemaRef,
  ToolInfo,
} from "./generated/types.js";

import type { Arity, CommandContract } from "./generated/types.js";

/** Hand-owned, and independent of the npm and NuGet package versions. */
export const CONTRACT_VERSION = "1";

/**
 * The three leaf unions.
 *
 * Kept by hand rather than taken from the generated file because the generated `ValueType` folds
 * `null` into the union, where the published one has always been the non-null set with nullability
 * expressed at each use site. Changing that would be a breaking change to a published package for
 * no gain.
 */
export type ContractStream = "stdout" | "stderr";
export type ValueType = "boolean" | "string" | "integer" | "number";
export type Stability = "stable" | "experimental" | "undeclared";

/** What a host hands an emitter, keyed by space-joined command id, e.g. `"md graph"`. */
export type CommandContractRegistry = Record<string, CommandContract>;

export function isRequired(arity: Arity): boolean {
  return arity.min >= 1;
}

export function isVariadic(arity: Arity): boolean {
  return arity.max === null || arity.max > 1;
}
