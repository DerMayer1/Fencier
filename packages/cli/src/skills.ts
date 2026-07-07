import { access, mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { CodexKitItem, CodexSkillId } from "@fencier/codex-kit";
import { getSkill, listSkills } from "@fencier/codex-kit";

export type SkillInstallSelection = CodexSkillId | "all";

export type InstalledSkill = {
  id: CodexSkillId;
  title: string;
  targetPath: string;
  absolutePath: string;
};

export type SkillInstallResult = {
  rootPath: string;
  installed: InstalledSkill[];
  conflicts: InstalledSkill[];
};

export function getLocalSkillRoot(cwd: string): string {
  return join(cwd, ".fencier", "skills");
}

export function parseSkillInstallSelection(value: string): SkillInstallSelection {
  if (value === "all") {
    return value;
  }

  if (isSkillId(value)) {
    return value;
  }

  throw new Error(`Unknown skill: ${value}`);
}

export async function installSkills(input: {
  cwd: string;
  selection: SkillInstallSelection;
  force?: boolean;
}): Promise<SkillInstallResult> {
  const selected = resolveSkillSelection(input.selection);
  const targets = selected.map((skill) => toInstalledSkill(input.cwd, skill));
  const conflicts = input.force ? [] : await findExistingSkills(targets);

  if (conflicts.length > 0) {
    return {
      rootPath: getLocalSkillRoot(input.cwd),
      installed: [],
      conflicts,
    };
  }

  for (const skill of selected) {
    const target = toInstalledSkill(input.cwd, skill);
    await mkdir(join(getLocalSkillRoot(input.cwd), skill.id), { recursive: true });
    await writeFile(target.absolutePath, skill.content, "utf8");
  }

  return {
    rootPath: getLocalSkillRoot(input.cwd),
    installed: targets,
    conflicts: [],
  };
}

function resolveSkillSelection(selection: SkillInstallSelection): CodexKitItem<CodexSkillId>[] {
  if (selection === "all") {
    return listSkills();
  }

  return [getSkill(selection)];
}

function isSkillId(value: string): value is CodexSkillId {
  return listSkills().some((skill) => skill.id === value);
}

function toInstalledSkill(cwd: string, skill: CodexKitItem<CodexSkillId>): InstalledSkill {
  return {
    id: skill.id,
    title: skill.title,
    targetPath: `.fencier/skills/${skill.id}/SKILL.md`,
    absolutePath: join(getLocalSkillRoot(cwd), skill.id, "SKILL.md"),
  };
}

async function findExistingSkills(skills: InstalledSkill[]): Promise<InstalledSkill[]> {
  const conflicts: InstalledSkill[] = [];

  for (const skill of skills) {
    try {
      await access(skill.absolutePath);
      conflicts.push(skill);
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }

  return conflicts;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
