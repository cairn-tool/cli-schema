#!/usr/bin/env node
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalizeJson, validate } from "../packages/cli-schema/dist/index.js";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const casesDir = join(repoRoot, "spec", "conformance");
const DOTNET_DROP = { arity: ["negate"] };

function loadJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function dropCommands(payload, ids) {
  const clone = structuredClone(payload);
  clone.commands = clone.commands.filter((command) => !ids.includes(command.id));
  return clone;
}

function fail(message) {
  console.error(message);
  process.exitCode = 1;
}

const names = readdirSync(casesDir).filter((name) =>
  existsSync(join(casesDir, name, "expected.json")),
);

if (!names.length) fail("No conformance cases found");

for (const name of names) {
  const golden = loadJson(join(casesDir, name, "expected.json"));
  const schema = validate(golden);
  if (!schema.valid) fail(`${name} golden is invalid: ${JSON.stringify(schema.errors, null, 2)}`);
}

const nodeDir = join(repoRoot, "artifacts", "node");
const dotnetDir = process.env.CLI_SCHEMA_ARTIFACTS ?? join(repoRoot, "artifacts", "dotnet");

for (const name of names) {
  const golden = loadJson(join(casesDir, name, "expected.json"));
  const expected = canonicalizeJson(golden);

  const nodePath = join(nodeDir, `${name}.json`);
  if (!existsSync(nodePath)) fail(`missing Node payload ${nodePath} (run npm test)`);
  else {
    const actual = loadJson(nodePath);
    const check = validate(actual);
    if (!check.valid) fail(`Node ${name} failed schema: ${JSON.stringify(check.errors)}`);
    const got = canonicalizeJson(actual);
    if (got !== expected) fail(`Node ${name} does not match golden`);
    else console.log(`ok  node ${name}`);
  }

  const dotnetPath = join(dotnetDir, `${name}.json`);
  if (!existsSync(dotnetPath)) fail(`missing .NET payload ${dotnetPath} (run dotnet test)`);
  else {
    const actual = loadJson(dotnetPath);
    const check = validate(actual);
    if (!check.valid) fail(`.NET ${name} failed schema: ${JSON.stringify(check.errors)}`);
    const compareTo = dropCommands(golden, DOTNET_DROP[name] ?? []);
    const got = canonicalizeJson(actual);
    const want = canonicalizeJson(compareTo);
    if (got !== want) fail(`.NET ${name} does not match golden`);
    else console.log(`ok  dotnet ${name}`);
  }
}

if (process.exitCode) process.exit(process.exitCode);
console.log("conformance: all emitters match");
