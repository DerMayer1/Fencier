import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { installAdapters, parseAdapterInstallSelection } from "./adapters";

describe("parseAdapterInstallSelection", () => {
  it("accepts known adapters and all", () => {
    expect(parseAdapterInstallSelection("codex")).toBe("codex");
    expect(parseAdapterInstallSelection("all")).toBe("all");
  });

  it("rejects unknown adapters", () => {
    expect(() => parseAdapterInstallSelection("gemini")).toThrow("Unknown adapter");
  });
});

describe("installAdapters", () => {
  it("installs all adapter files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-adapters-test-"));
    const result = await installAdapters({
      cwd,
      selection: "all",
    });

    expect(result.conflicts).toEqual([]);
    expect(result.installed.map((adapter) => adapter.id)).toEqual([
      "codex",
      "claude",
      "cursor",
      "copilot",
    ]);
    await expect(readFile(join(cwd, "AGENTS.md"), "utf8")).resolves.toContain(
      "This repository uses Fencier",
    );
    await expect(
      readFile(join(cwd, ".github", "copilot-instructions.md"), "utf8"),
    ).resolves.toContain("Fencier");
  });

  it("does not overwrite existing adapter files without force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-adapters-test-"));
    await writeFile(join(cwd, "AGENTS.md"), "existing", "utf8");

    const result = await installAdapters({
      cwd,
      selection: "codex",
    });

    expect(result.installed).toEqual([]);
    expect(result.conflicts.map((adapter) => adapter.targetPath)).toEqual(["AGENTS.md"]);
    await expect(readFile(join(cwd, "AGENTS.md"), "utf8")).resolves.toBe("existing");
  });

  it("overwrites existing adapter files with force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-adapters-test-"));
    await writeFile(join(cwd, "AGENTS.md"), "existing", "utf8");

    const result = await installAdapters({
      cwd,
      selection: "codex",
      force: true,
    });

    expect(result.conflicts).toEqual([]);
    expect(result.installed.map((adapter) => adapter.id)).toEqual(["codex"]);
    await expect(readFile(join(cwd, "AGENTS.md"), "utf8")).resolves.toContain(
      "This repository uses Fencier",
    );
  });
});
