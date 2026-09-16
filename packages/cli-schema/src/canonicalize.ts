const OBJECT_KEYS: Record<string, string[]> = {
  envelope: ["schemaVersion", "tool", "formatShorthands", "advisoryOutput", "schemas", "commands"],
  tool: ["name", "version"],
  advisoryOutput: ["description", "stream", "suppressedWhen", "optOutEnv"],
  schemaRef: ["id", "uri", "title", "commands"],
  command: [
    "id",
    "path",
    "description",
    "usage",
    "arguments",
    "options",
    "subcommands",
    "formats",
    "defaultFormat",
    "formatConfigurable",
    "outputSchema",
    "jsonlSchema",
    "sarifSchema",
    "exitCodes",
    "exitCodePassthrough",
    "stream",
    "writes",
    "stability",
    "notes",
  ],
  argument: ["name", "description", "arity", "valueType", "allowedValues", "default"],
  option: [
    "name",
    "aliases",
    "description",
    "valueName",
    "arity",
    "required",
    "negatable",
    "valueType",
    "allowedValues",
    "recursive",
    "default",
  ],
  arity: ["min", "max"],
  exitCode: ["code", "meaning"],
  passthrough: ["min", "max", "description"],
  stream: ["success", "findings"],
};

function reorder(value: Record<string, unknown>, keys: string[]): Record<string, unknown> {
  const ordered: Record<string, unknown> = {};
  for (const key of keys) {
    if (Object.prototype.hasOwnProperty.call(value, key)) ordered[key] = value[key];
  }
  for (const key of Object.keys(value)) {
    if (!Object.prototype.hasOwnProperty.call(ordered, key)) ordered[key] = value[key];
  }
  return ordered;
}

function walk(value: unknown, kind: string): unknown {
  if (Array.isArray(value)) {
    const itemKind =
      kind === "commands"
        ? "command"
        : kind === "arguments"
          ? "argument"
          : kind === "options"
            ? "option"
            : kind === "schemas"
              ? "schemaRef"
              : kind === "exitCodes"
                ? "exitCode"
                : "";
    return value.map((item) => walk(item, itemKind));
  }
  if (value === null || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const keys = OBJECT_KEYS[kind];
  const ordered = keys ? reorder(record, keys) : record;
  const next: Record<string, unknown> = {};
  for (const [key, child] of Object.entries(ordered)) {
    const childKind =
      key === "tool"
        ? "tool"
        : key === "advisoryOutput"
          ? "advisoryOutput"
          : key === "arity"
            ? "arity"
            : key === "exitCodePassthrough"
              ? "passthrough"
              : key === "stream"
                ? "stream"
                : key === "formatShorthands"
                  ? ""
                  : key;
    next[key] = walk(child, childKind);
  }
  return next;
}

/** Drops `tool.version` and rewrites the payload in spec key order. */
export function canonicalize(payload: unknown): unknown {
  const clone = structuredClone(payload) as Record<string, unknown>;
  const tool = clone.tool;
  if (tool && typeof tool === "object") delete (tool as Record<string, unknown>).version;
  return walk(clone, "envelope");
}

export function canonicalizeJson(payload: unknown): string {
  return JSON.stringify(canonicalize(payload), null, 2) + "\n";
}
