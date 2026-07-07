import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultPolicyYaml } from "@fencier/core";
import { describe, expect, it } from "vitest";
import { createCodexPrepareReport, createCodexRunbook, inspectCodexPreparation } from "./workflow";

describe("inspectCodexPreparation", () => {
  it("marks a repository ready when policy, adapter, and local skills exist", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-workflow-test-"));
    await writeFile(join(cwd, "fencier.yaml"), defaultPolicyYaml, "utf8");
    await writeFile(join(cwd, "AGENTS.md"), "# Agent rules\n", "utf8");

    for (const skillId of [
      "fencier-scope-control",
      "fencier-implementation",
      "fencier-review",
      "fencier-fix-audit",
    ]) {
      await mkdir(join(cwd, ".fencier", "skills", skillId), { recursive: true });
      await writeFile(join(cwd, ".fencier", "skills", skillId, "SKILL.md"), "# Skill\n", "utf8");
    }

    const status = await inspectCodexPreparation(cwd);

    expect(status.ready).toBe(true);
    expect(status.installedSkills).toBe(4);
    expect(status.missingSkills).toEqual([]);
  });

  it("reports setup actions when required files are missing", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-workflow-test-"));

    const report = await createCodexPrepareReport(cwd);

    expect(report).toContain("Status: NEEDS_SETUP");
    expect(report).toContain("Run `fencier init --codex`.");
    expect(report).toContain("Run `fencier codex skill install all --force`.");
  });
});

describe("createCodexRunbook", () => {
  it("combines brief, prompt, checklist, and completion commands", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-workflow-test-"));
    await writeFile(join(cwd, "fencier.yaml"), defaultPolicyYaml, "utf8");
    await writeFile(join(cwd, "AGENTS.md"), "# Agent rules\n", "utf8");

    const runbook = await createCodexRunbook(cwd, "implementation");

    expect(runbook).toContain("Fencier Codex Runbook: Implementation");
    expect(runbook).toContain("## Session Brief");
    expect(runbook).toContain("Fencier Codex Prompt: Implementation");
    expect(runbook).toContain("Implementation Checklist");
    expect(runbook).toContain("fencier verify");
  });
});
