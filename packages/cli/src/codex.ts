import { access, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parsePolicyConfig } from "@fencier/core";
import { readLatestAuditMarkdown } from "./audit";

export type CodexBrief = {
  repoPath: string;
  hasPolicy: boolean;
  hasCodexAdapter: boolean;
  policyVersion?: number;
  latestAudit?: string;
};

export async function createCodexBrief(cwd: string): Promise<string> {
  const [policyText, hasCodexAdapter, latestAudit] = await Promise.all([
    readOptional(join(cwd, "fencier.yaml")),
    fileExists(join(cwd, "AGENTS.md")),
    readLatestAuditMarkdown(cwd),
  ]);
  const policy = policyText ? parsePolicyConfig(policyText) : undefined;

  return formatCodexBrief({
    repoPath: cwd,
    hasPolicy: Boolean(policy),
    hasCodexAdapter,
    policyVersion: policy?.version,
    latestAudit,
  });
}

export function formatCodexBrief(brief: CodexBrief): string {
  const lines = [
    "# Fencier Codex CLI Brief",
    "",
    `Repository: ${brief.repoPath}`,
    `Policy: ${brief.hasPolicy ? `fencier.yaml v${brief.policyVersion}` : "missing"}`,
    `Codex adapter: ${brief.hasCodexAdapter ? "AGENTS.md installed" : "missing"}`,
    "",
    "## Required Workflow",
    "",
    "1. Read the user request, AGENTS.md, and fencier.yaml before editing.",
    "2. Keep changes inside the user request and the configured Fencier boundaries.",
    "3. Do not perform opportunistic refactors or unrelated cleanup.",
    "4. Do not move secrets, tokens, or API keys into client-side code.",
    "5. Run `fencier verify` before finishing.",
    "6. If `fencier verify` fails, fix the findings or report the remaining risk explicitly.",
    "",
    "## Useful Commands",
    "",
    "```bash",
    "fencier codex install",
    "fencier verify",
    "fencier audit show latest",
    "```",
  ];

  if (!brief.hasPolicy) {
    lines.push("", "## Missing Setup", "", "Run `fencier init --codex` first.");
  } else if (!brief.hasCodexAdapter) {
    lines.push("", "## Missing Setup", "", "Run `fencier codex install` to create AGENTS.md.");
  }

  if (brief.latestAudit) {
    lines.push("", "## Latest Audit", "", trimAuditForBrief(brief.latestAudit));
  }

  lines.push("");

  return lines.join("\n");
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

function trimAuditForBrief(markdown: string): string {
  return markdown.split("\n").slice(0, 80).join("\n").trim();
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
