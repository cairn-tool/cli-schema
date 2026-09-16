import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { canonicalizeJson, validate } from "@cairn-tool/cli-schema";
import { buildDescription } from "../src/walk.js";
import {
  TOOL,
  arityProgram,
  contractProgram,
  contractWalkOptions,
  minimalProgram,
  nestedProgram,
} from "./fixtures.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "../../..");
const specRoot = join(repoRoot, "spec");
const artifactDir = join(repoRoot, "artifacts", "node");

function loadGolden(name: string): unknown {
  return JSON.parse(
    readFileSync(join(specRoot, "conformance", name, "expected.json"), "utf8"),
  ) as unknown;
}

function writeArtifact(name: string, payload: unknown): void {
  mkdirSync(artifactDir, { recursive: true });
  writeFileSync(join(artifactDir, `${name}.json`), JSON.stringify(payload, null, 2) + "\n");
}

function expectMatch(name: string, payload: unknown): void {
  const golden = loadGolden(name);
  const schemaCheck = validate(payload);
  expect(schemaCheck.errors, JSON.stringify(schemaCheck.errors, null, 2)).toEqual([]);
  expect(schemaCheck.valid).toBe(true);
  expect(canonicalizeJson(payload)).toBe(canonicalizeJson(golden));
  writeArtifact(name, payload);
}

describe("conformance goldens", () => {
  it("minimal", () => {
    expectMatch("minimal", buildDescription(minimalProgram(), TOOL));
  });

  it("nested", () => {
    expectMatch("nested", buildDescription(nestedProgram(), TOOL));
  });

  it("arity", () => {
    expectMatch("arity", buildDescription(arityProgram(), TOOL));
  });

  it("contract", () => {
    expectMatch("contract", buildDescription(contractProgram(), TOOL, contractWalkOptions()));
  });

  it("goldens themselves validate", () => {
    for (const name of ["minimal", "nested", "arity", "contract"]) {
      const result = validate(loadGolden(name));
      expect(result.valid, `${name}: ${JSON.stringify(result.errors)}`).toBe(true);
    }
  });
});
