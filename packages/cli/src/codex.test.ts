import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { defaultPolicyYaml } from "@fencier/core";
import { describe, expect, it } from "vitest";
import { createCodexBrief, formatCodexBrief } from "./codex";

describe("formatCodexBrief", () => {
  it("prints the required Codex CLI workflow", () => {
    const brief = formatCodexBrief({
      repoPath: "/repo",
      hasPolicy: true,
      hasCodexAdapter: true,
      policyVersion: 1,
    });

    expect(brief).toContain("Fencier Codex CLI Brief");
    expect(brief).toContain("Run `fencier verify` before finishing.");
    expect(brief).toContain("fencier audit show latest");
  });
});

describe("createCodexBrief", () => {
  it("detects local policy and AGENTS.md", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-codex-test-"));
    await writeFile(join(cwd, "fencier.yaml"), defaultPolicyYaml, "utf8");
    await writeFile(join(cwd, "AGENTS.md"), "# Agent rules\n", "utf8");
    await mkdir(join(cwd, ".fencier", "audits"), { recursive: true });
    await writeFile(join(cwd, ".fencier", "audits", "latest.md"), "# Fencier Audit\n", "utf8");

    const brief = await createCodexBrief(cwd);

    expect(brief).toContain("Policy: fencier.yaml v1");
    expect(brief).toContain("Codex adapter: AGENTS.md installed");
    expect(brief).toContain("## Latest Audit");
  });
});
