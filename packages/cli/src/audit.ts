import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { DiffFile, FencierPolicy, PolicyFinding, PolicyResult } from "@fencier/core";

export type RepoContext = {
  path: string;
  branch?: string;
  commit?: string;
};

export type AuditEvent = {
  version: 1;
  id: string;
  timestamp: string;
  repo: RepoContext;
  policy: {
    file: "fencier.yaml";
    version: number;
  };
  status: PolicyResult["status"];
  risk: PolicyResult["risk"];
  score: number;
  summary: PolicyResult["summary"];
  findings: PolicyFinding[];
  changedFiles: DiffFile[];
};

export type WrittenAudit = {
  id: string;
  markdownPath?: string;
  jsonPath?: string;
};

export async function writeAuditReports(input: {
  cwd: string;
  policy: FencierPolicy;
  result: PolicyResult;
  repo: RepoContext;
}): Promise<WrittenAudit> {
  const timestamp = new Date().toISOString();
  const id = timestamp.replace(/[:.]/g, "-");
  const audit = createAuditEvent({
    id,
    timestamp,
    policy: input.policy,
    result: input.result,
    repo: input.repo,
  });
  const auditDir = join(input.cwd, ".fencier", "audits");

  await mkdir(auditDir, { recursive: true });

  const written: WrittenAudit = { id };

  if (input.policy.audit.write_markdown) {
    written.markdownPath = join(auditDir, `${id}.md`);
    await writeFile(written.markdownPath, formatAuditMarkdown(audit), "utf8");
  }

  if (input.policy.audit.write_json) {
    written.jsonPath = join(auditDir, `${id}.json`);
    await writeFile(written.jsonPath, `${JSON.stringify(audit, null, 2)}\n`, "utf8");
  }

  return written;
}

export async function listAuditFiles(cwd: string): Promise<string[]> {
  const auditDir = join(cwd, ".fencier", "audits");

  try {
    const entries = await readdir(auditDir);
    return entries
      .filter((entry) => entry.endsWith(".json") || entry.endsWith(".md"))
      .sort()
      .reverse();
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
}

export async function readLatestAuditMarkdown(cwd: string): Promise<string | undefined> {
  const audits = await listAuditFiles(cwd);
  const latestMarkdown = audits.find((audit) => audit.endsWith(".md"));

  if (!latestMarkdown) {
    return undefined;
  }

  return readFile(join(cwd, ".fencier", "audits", latestMarkdown), "utf8");
}

function createAuditEvent(input: {
  id: string;
  timestamp: string;
  policy: FencierPolicy;
  result: PolicyResult;
  repo: RepoContext;
}): AuditEvent {
  return {
    version: 1,
    id: input.id,
    timestamp: input.timestamp,
    repo: input.repo,
    policy: {
      file: "fencier.yaml",
      version: input.policy.version,
    },
    status: input.result.status,
    risk: input.result.risk,
    score: input.result.score,
    summary: input.result.summary,
    findings: input.result.findings,
    changedFiles: input.result.evaluatedFiles.map((file) => ({
      path: file.path,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
    })),
  };
}

function formatAuditMarkdown(audit: AuditEvent): string {
  const lines = [
    "# Fencier Audit",
    "",
    `Date: ${audit.timestamp}`,
    `Status: ${audit.status.toUpperCase()}`,
    `Risk: ${audit.risk.toUpperCase()}`,
    `Score: ${audit.score}`,
    "",
    "## Summary",
    "",
    `- Files changed: ${audit.summary.filesChanged}`,
    `- Lines added: ${audit.summary.linesAdded}`,
    `- Lines removed: ${audit.summary.linesRemoved}`,
    `- Findings: ${audit.findings.length}`,
    "",
    "## Findings",
    "",
  ];

  if (audit.findings.length === 0) {
    lines.push("- None", "");
  } else {
    for (const finding of audit.findings) {
      lines.push(`### ${finding.severity.toUpperCase()}: ${finding.message}`);
      lines.push("");

      if (finding.file) {
        lines.push(`File: \`${finding.file}\``);
      }

      if (finding.lineNumber) {
        lines.push(`Line: ${finding.lineNumber}`);
      }

      lines.push(`Rule: \`${finding.ruleId}\``);

      if (finding.pattern) {
        lines.push(`Pattern: \`${finding.pattern}\``);
      }

      if (finding.preview) {
        lines.push(`Preview: \`${finding.preview}\``);
      }

      lines.push("");
    }
  }

  lines.push("## Changed Files", "");
  lines.push("| File | Status | Added | Removed |");
  lines.push("|---|---|---:|---:|");

  for (const file of audit.changedFiles) {
    lines.push(`| \`${file.path}\` | ${file.status} | ${file.additions} | ${file.deletions} |`);
  }

  lines.push("", "## Policy", "");
  lines.push(`Policy file: \`${audit.policy.file}\``);
  lines.push(`Policy version: ${audit.policy.version}`);
  lines.push("", "## Notes", "");
  lines.push("Fencier does not prove this change is safe. Human review is required.");
  lines.push("");

  return lines.join("\n");
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
