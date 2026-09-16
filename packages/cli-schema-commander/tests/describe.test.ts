import { Command } from "commander";
import { describe, expect, it } from "vitest";
import type { DescribeResult } from "@cairn-tool/cli-schema";
import { renderText } from "@cairn-tool/cli-schema";
import { addDescribeCommand } from "../src/describe.js";
import { buildDescription, selectCommands } from "../src/walk.js";
import { TOOL, contractProgram, contractWalkOptions, minimalProgram } from "./fixtures.js";

describe("selectCommands", () => {
  it("narrows to a path and its descendants", () => {
    const full = buildDescription(contractProgram(), TOOL, contractWalkOptions());
    const selected = selectCommands(full, ["group"]);
    expect(selected.commands.map((command) => command.id)).toEqual(["group", "group leaf"]);
  });

  it("throws on an unknown path", () => {
    const full = buildDescription(minimalProgram(), TOOL);
    expect(() => selectCommands(full, ["missing"])).toThrow("Unknown command: missing");
  });
});

describe("renderText of a walked tree", () => {
  const result = buildDescription(contractProgram(), TOOL, contractWalkOptions());

  it("llm output names commands without ANSI", () => {
    const text = renderText(result, false);
    expect(text).toContain("demo 0.0.0");
    expect(text).toContain("  contract: undeclared");
    expect(text).not.toContain("\x1b[");
  });

  it("human output bolds ids and dims undeclared", () => {
    const text = renderText(result, true);
    expect(text).toContain("\x1b[1mrun\x1b[0m");
    expect(text).toContain("\x1b[2mcontract: undeclared\x1b[0m");
  });
});

describe("addDescribeCommand", () => {
  it("writes json to stdout", async () => {
    const program = new Command("demo");
    program.command("greet").description("Say hello");
    addDescribeCommand(program, { toolName: "demo", toolVersion: "0.0.0" });
    program.exitOverride();
    let written = "";
    const stdout = process.stdout.write.bind(process.stdout);
    process.stdout.write = ((chunk: string | Uint8Array) => {
      written += typeof chunk === "string" ? chunk : Buffer.from(chunk).toString("utf8");
      return true;
    }) as typeof process.stdout.write;
    try {
      await program.parseAsync(["describe", "--format", "json"], { from: "user" });
    } finally {
      process.stdout.write = stdout;
    }
    const payload = JSON.parse(written) as DescribeResult;
    expect(payload.schemaVersion).toBe("1");
    expect(payload.commands.map((command) => command.id)).toContain("greet");
  });

  it("rejects an unknown format rather than substituting", async () => {
    const program = new Command("demo");
    addDescribeCommand(program, { toolName: "demo", toolVersion: "0.0.0" });
    program.exitOverride();
    await expect(
      program.parseAsync(["describe", "--format", "yaml"], { from: "user" }),
    ).rejects.toThrow("Invalid output format: yaml");
  });
});
