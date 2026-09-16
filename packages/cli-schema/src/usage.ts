import { isRequired, isVariadic, type DescribedArgument, type DescribedOption } from "./types.js";

/**
 * Spec-defined usage string. A pure function of the rest of the command, so two
 * emitters cannot disagree on a required field.
 */
export function buildUsage(
  toolName: string,
  path: string[],
  options: readonly Pick<DescribedOption, "name">[],
  args: readonly DescribedArgument[],
): string {
  const parts = [toolName, ...path];
  const rest: string[] = [];
  if (options.length) rest.push("[options]");
  for (const argument of args) {
    const variadic = isVariadic(argument.arity);
    const required = isRequired(argument.arity);
    if (variadic) rest.push(required ? `<${argument.name}...>` : `[${argument.name}...]`);
    else rest.push(required ? `<${argument.name}>` : `[${argument.name}]`);
  }
  return [...parts, ...rest].join(" ");
}
