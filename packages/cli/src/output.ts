import type { PolicyResult } from "@fencier/core";

export function formatCheckResult(result: PolicyResult): string {
  const lines = [
    "Fencier Verification",
    "",
    `Status: ${result.status.toUpperCase()}`,
    `Risk: ${result.risk.toUpperCase()}`,
    `Score: ${result.score}`,
    "",
    `Changed files: ${result.summary.filesChanged}`,
    `Changed lines: +${result.summary.linesAdded} / -${result.summary.linesRemoved}`,
  ];

  if (result.findings.length === 0) {
    lines.push("", "Policy findings:", "- None");
    return lines.join("\n");
  }

  lines.push("", "Policy findings:");

  for (const finding of result.findings) {
    const location = finding.file ? ` (${finding.file})` : "";
    lines.push(`- ${finding.severity.toUpperCase()}: ${finding.message}${location}`);
  }

  return lines.join("\n");
}
