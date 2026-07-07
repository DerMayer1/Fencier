import { describe, expect, it } from "vitest";
import { createProgram } from "./cli";

describe("createProgram", () => {
  it("configures the fencier CLI", () => {
    const program = createProgram();

    expect(program.name()).toBe("fencier");
    expect(program.commands.map((command) => command.name())).toContain("doctor");
    expect(program.commands.map((command) => command.name())).toContain("init");
    expect(program.commands.map((command) => command.name())).toContain("check");
    expect(program.commands.map((command) => command.name())).toContain("verify");
    expect(program.commands.map((command) => command.name())).toContain("audit");
    expect(program.commands.map((command) => command.name())).toContain("codex");
    expect(program.commands.map((command) => command.name())).toContain("adapters");
  });

  it("exposes Codex as the primary init path", () => {
    const program = createProgram();
    const init = program.commands.find((command) => command.name() === "init");

    expect(init?.options.map((option) => option.long)).toContain("--codex");
  });
});
