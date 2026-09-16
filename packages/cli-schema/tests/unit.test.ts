import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { buildUsage, renderText, validate } from "../src/index.js";
import type { DescribeResult } from "../src/types.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");

describe("buildUsage", () => {
  it("joins the tool, path, options marker, and arguments", () => {
    expect(
      buildUsage(
        "demo",
        ["run"],
        [{ name: "--output" }],
        [
          {
            name: "script",
            description: "",
            arity: { min: 1, max: 1 },
            valueType: "string",
            allowedValues: null,
          },
          {
            name: "args",
            description: "",
            arity: { min: 0, max: null },
            valueType: "string",
            allowedValues: null,
          },
        ],
      ),
    ).toBe("demo run [options] <script> [args...]");
  });

  it("omits [options] when there are none", () => {
    expect(
      buildUsage(
        "demo",
        ["variadic"],
        [],
        [
          {
            name: "files",
            description: "",
            arity: { min: 0, max: null },
            valueType: "string",
            allowedValues: null,
          },
        ],
      ),
    ).toBe("demo variadic [files...]");
  });
});

describe("the published schema", () => {
  it("does not depend on commander", () => {
    const pkg = JSON.parse(readFileSync(join(here, "../package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      peerDependencies?: Record<string, string>;
    };
    expect(pkg.dependencies?.commander).toBeUndefined();
    expect(pkg.peerDependencies?.commander).toBeUndefined();
  });

  it("matches spec/v1/cli-schema.json", () => {
    const spec = JSON.parse(readFileSync(join(repoRoot, "spec", "v1", "cli-schema.json"), "utf8"));
    const published = JSON.parse(readFileSync(join(here, "../src/cli-schema.json"), "utf8"));
    expect(published).toEqual(spec);
  });

  it("validates a minimal payload", () => {
    const payload: DescribeResult = {
      schemaVersion: "1",
      tool: { name: "demo", version: "0.0.0" },
      formatShorthands: {},
      schemas: [],
      commands: [],
    };
    const result = validate(payload);
    expect(result.valid, JSON.stringify(result.errors)).toBe(true);
  });
});

describe("renderText", () => {
  const result: DescribeResult = {
    schemaVersion: "1",
    tool: { name: "demo", version: "0.0.0" },
    formatShorthands: { "-fj": "--format=json" },
    advisoryOutput: {
      description:
        "The update notice is advisory only and never appears on a machine-readable stream.",
      stream: "stderr",
      suppressedWhen: ["DEMO_NO_NOTICE=1"],
      optOutEnv: "DEMO_NO_NOTICE",
    },
    schemas: [],
    commands: [
      {
        id: "run",
        path: ["run"],
        description: "Run a script",
        usage: "demo run",
        arguments: [],
        options: [],
        subcommands: [],
        formats: null,
        defaultFormat: null,
        formatConfigurable: false,
        outputSchema: null,
        exitCodes: [],
        stream: null,
        writes: null,
        stability: "undeclared",
      },
    ],
  };

  it("llm output has no ANSI", () => {
    const text = renderText(result, false);
    expect(text).toContain("demo 0.0.0");
    expect(text).toContain("format shorthands: -fj = --format=json");
    expect(text).toContain("  contract: undeclared");
    expect(text).not.toContain("\x1b[");
  });

  it("human output bolds ids and dims undeclared", () => {
    const text = renderText(result, true);
    expect(text).toContain("\x1b[1mrun\x1b[0m");
    expect(text).toContain("\x1b[2mcontract: undeclared\x1b[0m");
  });
});
