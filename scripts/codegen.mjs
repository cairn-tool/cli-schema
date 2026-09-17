#!/usr/bin/env node
/**
 * Generates the model types for both languages from spec/v1/cli-schema.json.
 *
 * The spec is the single source of the payload shape, so the models are not hand-written beside
 * it. Output is committed so a spec change is reviewable as a diff of the public API -- which
 * matters more here than usual: these packages are published, so a change to a generated type is a
 * change to somebody else's compile.
 *
 *   node scripts/codegen.mjs            rewrite the generated sources
 *   node scripts/codegen.mjs --check    exit 1 if any is out of date
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join, relative } from "node:path";
import prettier from "prettier";
import { compile } from "json-schema-to-typescript";
import { emitCSharp } from "./emit-csharp.mjs";

const ROOT = new URL("..", import.meta.url).pathname;
const SPEC = join(ROOT, "spec/v1/cli-schema.json");

const BANNER = `/*
 * GENERATED FILE -- do not edit.
 *
 * Produced from spec/v1/cli-schema.json by \`npm run codegen\`. Edit the spec, then regenerate;
 * \`npm run codegen:check\` fails CI when the two have drifted.
 */
`;

const check = process.argv.includes("--check");
const stale = [];

function settle(path, contents) {
  const existing = existsSync(path) ? readFileSync(path, "utf8") : null;
  if (existing === contents) return;
  if (check) {
    stale.push(relative(ROOT, path));
    return;
  }
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, contents, "utf8");
}

const schema = JSON.parse(readFileSync(SPEC, "utf8"));

// The root `title` and `$id` are dropped so the generator takes the name passed to it; it falls
// back to `$id` otherwise. The `$defs` titles are kept -- those ARE the published type names.
const rootless = { ...schema };
delete rootless.title;
delete rootless.$id;

const prettierConfig = await prettier.resolveConfig(join(ROOT, "package.json"));

const options = {
  bannerComment: "",
  declareExternallyReferenced: true,
  additionalProperties: false,
  enableConstEnums: false,
};

const ts = await compile(rootless, "DescribeResult", options);

// CommandContract is reachable from nothing in the payload -- it is what a host hands an emitter,
// not something the emitter writes -- so it has to be compiled in its own pass. Its $defs are
// carried across so `arity` and friends resolve; the duplicate declarations that produces are
// dropped, keeping the ones from the payload pass.
const contractSchema = { ...schema.$defs.commandContract, $defs: schema.$defs };
const contractTs = await compile(contractSchema, "CommandContract", options);
const already = new Set([...ts.matchAll(/export (?:interface|type) (\w+)/g)].map((m) => m[1]));
const contractOnly = contractTs
  .split(/(?=export (?:interface|type) )/)
  .filter((block) => {
    const name = /export (?:interface|type) (\w+)/.exec(block)?.[1];
    return name !== undefined && !already.has(name);
  })
  .join("");
settle(
  join(ROOT, "packages/cli-schema/src/generated/types.ts"),
  await prettier.format(BANNER + ts + contractOnly, { ...prettierConfig, parser: "typescript" }),
);

settle(
  join(ROOT, "dotnet/src/CairnTool.CliSchema/Generated/Models.cs"),
  emitCSharp({
    schema,
    rootName: "DescribeResult",
    namespace: "CairnTool.CliSchema",
    // null: CliSchemaJsonContext stays hand-written. Its options -- camelCase,
    // DefaultIgnoreCondition.Never, WriteIndented, and the Metadata|Serialization generation mode
    // -- are what make the two languages agree on the wire, and the conformance goldens depend on
    // them. Those are behaviour, not shape, so they are not regenerated.
    contextName: null,
    // Positional: `new Arity(0, 1)` and the other primary constructors are part of the published
    // 1.0.0 API. Init-only properties would not provide them, which is a breaking change for
    // every consumer that constructs one -- including this repository's own emitter package.
    style: "positional",
  }),
);

if (check && stale.length > 0) {
  console.error("These generated sources are out of date. Run `npm run codegen`:\n");
  for (const path of stale) console.error(`  ${path}`);
  process.exit(1);
}

console.log(check ? "generated sources are current" : "generated sources rebuilt");
