import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { initializeFencier } from "./init";

describe("initializeFencier", () => {
  it("creates policy, audit directory, and optional Codex adapter", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-init-test-"));

    const result = await initializeFencier({
      cwd,
      adapterSelection: "codex",
    });

    expect(result.policyCreated).toBe(true);
    expect(result.auditsCreated).toBe(true);
    expect(result.adapterResult?.installed.map((adapter) => adapter.id)).toEqual(["codex"]);
    await expect(readFile(join(cwd, "fencier.yaml"), "utf8")).resolves.toContain("version: 1");
    await expect(readFile(join(cwd, "AGENTS.md"), "utf8")).resolves.toContain(
      "This repository uses Fencier",
    );
  });

  it("keeps an existing policy without force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-init-test-"));
    await writeFile(join(cwd, "fencier.yaml"), "existing-policy", "utf8");

    const result = await initializeFencier({
      cwd,
    });

    expect(result.policyCreated).toBe(false);
    await expect(readFile(join(cwd, "fencier.yaml"), "utf8")).resolves.toBe("existing-policy");
  });

  it("overwrites an existing policy with force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-init-test-"));
    await writeFile(join(cwd, "fencier.yaml"), "existing-policy", "utf8");

    const result = await initializeFencier({
      cwd,
      force: true,
    });

    expect(result.policyCreated).toBe(true);
    await expect(readFile(join(cwd, "fencier.yaml"), "utf8")).resolves.toContain("version: 1");
  });
});
