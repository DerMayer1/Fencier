import { describe, expect, it } from "vitest";
import {
  getAdapter,
  getPrimaryAdapter,
  isAdapterId,
  listAdapters,
  resolveAdapterSelection,
} from "./index";

describe("adapters", () => {
  it("lists the supported adapters", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toEqual([
      "codex",
      "claude",
      "cursor",
      "copilot",
    ]);
  });

  it("resolves adapter targets", () => {
    expect(getAdapter("codex")).toMatchObject({
      role: "primary",
      targetPath: "AGENTS.md",
    });
    expect(getAdapter("codex").content).toContain("Codex CLI workflow");
    expect(getAdapter("codex").content).toContain("fencier verify");
    expect(getAdapter("copilot")).toMatchObject({
      role: "compatibility",
      targetPath: ".github/copilot-instructions.md",
    });
  });

  it("treats Codex as the primary adapter", () => {
    expect(getPrimaryAdapter()).toMatchObject({
      id: "codex",
      targetPath: "AGENTS.md",
    });
  });

  it("validates adapter ids", () => {
    expect(isAdapterId("claude")).toBe(true);
    expect(isAdapterId("gemini")).toBe(false);
  });

  it("resolves all adapters", () => {
    expect(resolveAdapterSelection("all")).toHaveLength(4);
  });
});
