import { mkdtemp, readFile, readdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { type PolicyResult, parsePolicyConfig } from "@fencier/core";
import { describe, expect, it } from "vitest";
import { writeAuditReports } from "./audit";

describe("writeAuditReports", () => {
  it("writes audit metadata without full added lines or secret values", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-audit-test-"));
    const policy = parsePolicyConfig("version: 1\n");
    const result: PolicyResult = {
      status: "fail",
      risk: "high",
      score: 50,
      summary: {
        filesChanged: 1,
        linesAdded: 1,
        linesRemoved: 0,
        totalLinesChanged: 1,
      },
      findings: [
        {
          ruleId: "secret_pattern",
          severity: "critical",
          message: "Possible secret detected in src/config.ts",
          file: "src/config.ts",
          pattern: "openai_api_key",
          lineNumber: 1,
          preview: "sk-1...redacted",
          score: 50,
        },
      ],
      evaluatedFiles: [
        {
          path: "src/config.ts",
          status: "modified",
          additions: 1,
          deletions: 0,
          addedLines: [
            {
              lineNumber: 1,
              content: "OPENAI_API_KEY=sk-1234567890abcdefghijklmnop",
            },
          ],
        },
      ],
    };

    await writeAuditReports({
      cwd,
      policy,
      result,
      repo: {
        path: cwd,
        branch: "main",
        commit: "abc123",
      },
    });

    const auditFiles = await readdir(join(cwd, ".fencier", "audits"));
    const jsonAudit = auditFiles.find((file) => file.endsWith(".json"));

    expect(jsonAudit).toBeDefined();

    const contents = await readFile(join(cwd, ".fencier", "audits", jsonAudit as string), "utf8");

    expect(contents).toContain("sk-1...redacted");
    expect(contents).not.toContain("abcdefghijklmnop");
    expect(contents).not.toContain("addedLines");
  });
});
