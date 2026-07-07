import { mkdir, mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { getLocalSkillRoot, installSkills, parseSkillInstallSelection } from "./skills";

describe("parseSkillInstallSelection", () => {
  it("accepts known skills and all", () => {
    expect(parseSkillInstallSelection("fencier-scope-control")).toBe("fencier-scope-control");
    expect(parseSkillInstallSelection("all")).toBe("all");
  });

  it("rejects unknown skills", () => {
    expect(() => parseSkillInstallSelection("unknown-skill")).toThrow("Unknown skill");
  });
});

describe("installSkills", () => {
  it("installs all local skill files", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-skills-test-"));
    const result = await installSkills({
      cwd,
      selection: "all",
    });

    expect(result.rootPath).toBe(getLocalSkillRoot(cwd));
    expect(result.conflicts).toEqual([]);
    expect(result.installed.map((skill) => skill.id)).toEqual([
      "fencier-scope-control",
      "fencier-implementation",
      "fencier-review",
      "fencier-fix-audit",
    ]);
    await expect(
      readFile(join(cwd, ".fencier", "skills", "fencier-scope-control", "SKILL.md"), "utf8"),
    ).resolves.toContain("Fencier Scope Control");
  });

  it("does not overwrite existing local skill files without force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-skills-test-"));
    const target = join(cwd, ".fencier", "skills", "fencier-scope-control", "SKILL.md");
    await mkdir(join(cwd, ".fencier", "skills", "fencier-scope-control"), {
      recursive: true,
    });
    await writeFile(target, "existing", "utf8");

    const result = await installSkills({
      cwd,
      selection: "fencier-scope-control",
    });

    expect(result.installed).toEqual([]);
    expect(result.conflicts.map((skill) => skill.targetPath)).toEqual([
      ".fencier/skills/fencier-scope-control/SKILL.md",
    ]);
    await expect(readFile(target, "utf8")).resolves.toBe("existing");
  });

  it("overwrites existing local skill files with force", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-skills-test-"));
    const target = join(cwd, ".fencier", "skills", "fencier-scope-control", "SKILL.md");
    await mkdir(join(cwd, ".fencier", "skills", "fencier-scope-control"), {
      recursive: true,
    });
    await writeFile(target, "existing", "utf8");

    const result = await installSkills({
      cwd,
      selection: "fencier-scope-control",
      force: true,
    });

    expect(result.conflicts).toEqual([]);
    expect(result.installed.map((skill) => skill.id)).toEqual(["fencier-scope-control"]);
    await expect(readFile(target, "utf8")).resolves.toContain("Fencier Scope Control");
  });
});
