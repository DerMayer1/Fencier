import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CodexPromptId } from "@fencier/codex-kit";
import { getChecklist, listSkills, renderPrompt } from "@fencier/codex-kit";
import { parsePolicyConfig } from "@fencier/core";
import { readLatestAuditMarkdown } from "./audit";
import { createCodexBrief } from "./codex";
import { getLocalSkillRoot } from "./skills";

export type CodexPrepareStatus = {
  repoPath: string;
  hasPolicy: boolean;
  policyVersion?: number;
  hasCodexAdapter: boolean;
  installedSkills: number;
  totalSkills: number;
  missingSkills: string[];
  hasLatestAudit: boolean;
  ready: boolean;
};

export async function createCodexPrepareReport(cwd: string): Promise<string> {
  return formatCodexPrepareReport(await inspectCodexPreparation(cwd));
}

export async function inspectCodexPreparation(cwd: string): Promise<CodexPrepareStatus> {
  const [policyText, hasCodexAdapter, installedSkillIds, latestAudit] = await Promise.all([
    readOptional(join(cwd, "fencier.yaml")),
    fileExists(join(cwd, "AGENTS.md")),
    listInstalledLocalSkillIds(cwd),
    readLatestAuditMarkdown(cwd),
  ]);
  const policy = policyText ? parsePolicyConfig(policyText) : undefined;
  const allSkills = listSkills();
  const installed = new Set(installedSkillIds);
  const missingSkills = allSkills
    .map((skill) => skill.id)
    .filter((skillId) => !installed.has(skillId));

  return {
    repoPath: cwd,
    hasPolicy: Boolean(policy),
    policyVersion: policy?.version,
    hasCodexAdapter,
    installedSkills: allSkills.length - missingSkills.length,
    totalSkills: allSkills.length,
    missingSkills,
    hasLatestAudit: Boolean(latestAudit),
    ready: Boolean(policy) && hasCodexAdapter && missingSkills.length === 0,
  };
}

export function formatCodexPrepareReport(status: CodexPrepareStatus): string {
  const lines = [
    "# Fencier Codex Prepare",
    "",
    `Repository: ${status.repoPath}`,
    `Policy: ${status.hasPolicy ? `OK (fencier.yaml v${status.policyVersion})` : "MISSING"}`,
    `Codex adapter: ${status.hasCodexAdapter ? "OK (AGENTS.md)" : "MISSING"}`,
    `Local skills: ${status.installedSkills}/${status.totalSkills} installed`,
    `Latest audit: ${status.hasLatestAudit ? "FOUND" : "MISSING"}`,
    "",
    `Status: ${status.ready ? "READY" : "NEEDS_SETUP"}`,
    "",
    "## Next Actions",
    "",
  ];

  if (!status.hasPolicy) {
    lines.push("- Run `fencier init --codex`.");
  }

  if (status.hasPolicy && !status.hasCodexAdapter) {
    lines.push("- Run `fencier codex install`.");
  }

  if (status.missingSkills.length > 0) {
    lines.push("- Run `fencier codex skill install all --force`.");
  }

  if (!status.hasLatestAudit) {
    lines.push("- Run `fencier verify` before finishing the next Codex session.");
  }

  if (status.ready) {
    lines.push("- Start the Codex task with `fencier codex runbook implementation`.");
    lines.push("- Run `fencier verify` before the final response.");
  }

  lines.push("");

  return lines.join("\n");
}

export async function createCodexRunbook(cwd: string, id: CodexPromptId): Promise<string> {
  const [brief, latestAudit] = await Promise.all([
    createCodexBrief(cwd),
    readLatestAuditMarkdown(cwd),
  ]);
  const prompt = renderPrompt(id, {
    repoPath: cwd,
    latestAudit: id === "fix-audit" ? latestAudit : undefined,
  });
  const checklist = getChecklist(id);

  return [
    `# Fencier Codex Runbook: ${checklist.title.replace(" Checklist", "")}`,
    "",
    "## Session Brief",
    "",
    brief.trim(),
    "",
    "## Task Prompt",
    "",
    prompt.trim(),
    "",
    "## Checklist",
    "",
    checklist.content.trim(),
    "",
    "## Completion Commands",
    "",
    "```bash",
    "fencier verify",
    "fencier audit show latest",
    "```",
    "",
  ].join("\n");
}

async function listInstalledLocalSkillIds(cwd: string): Promise<string[]> {
  const installed: string[] = [];

  for (const skill of listSkills()) {
    if (await fileExists(join(getLocalSkillRoot(cwd), skill.id, "SKILL.md"))) {
      installed.push(skill.id);
    }
  }

  return installed;
}

async function readOptional(path: string): Promise<string | undefined> {
  try {
    return await readFile(path, "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return undefined;
    }

    throw error;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return false;
    }

    throw error;
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
