import picomatch from "picomatch";
import type { DiffFile, DiffSummary } from "./diff";
import { summarizeDiff } from "./diff";
import type { FencierPolicy } from "./policy";
import type { RiskLevel } from "./risk";
import { calculateRiskScore, deriveRiskLevel, riskScoreWeights } from "./risk";
import { scanLineForSecret } from "./secrets";

export type PolicyStatus = "pass" | "warn" | "fail";

export type FindingSeverity = "low" | "medium" | "high" | "critical";

export type PolicyFinding = {
  ruleId:
    | "blocked_path"
    | "outside_allowed_paths"
    | "sensitive_path"
    | "max_files_changed"
    | "max_lines_changed"
    | "missing_tests"
    | "secret_pattern";
  severity: FindingSeverity;
  message: string;
  file?: string;
  pattern?: string;
  lineNumber?: number;
  preview?: string;
  score: number;
};

export type PolicyResult = {
  status: PolicyStatus;
  risk: RiskLevel;
  score: number;
  findings: PolicyFinding[];
  summary: DiffSummary;
  evaluatedFiles: DiffFile[];
};

export type EvaluatePolicyInput = {
  policy: FencierPolicy;
  files: DiffFile[];
};

export function evaluatePolicy(input: EvaluatePolicyInput): PolicyResult {
  const evaluatedFiles = input.files.filter(
    (file) => !matchesAnyPattern(file.path, input.policy.scope.ignored_paths),
  );
  const summary = summarizeDiff(evaluatedFiles);
  const findings: PolicyFinding[] = [];

  if (summary.filesChanged > input.policy.rules.max_files_changed) {
    findings.push({
      ruleId: "max_files_changed",
      severity: "medium",
      message: `Changed files exceed max_files_changed: ${summary.filesChanged} > ${input.policy.rules.max_files_changed}`,
      score: riskScoreWeights.maxFilesChanged,
    });
  }

  if (summary.totalLinesChanged > input.policy.rules.max_lines_changed) {
    findings.push({
      ruleId: "max_lines_changed",
      severity: "medium",
      message: `Changed lines exceed max_lines_changed: ${summary.totalLinesChanged} > ${input.policy.rules.max_lines_changed}`,
      score: riskScoreWeights.maxLinesChanged,
    });
  }

  const testsChanged = evaluatedFiles.some((file) => isTestPath(file.path));
  const missingTestPatterns = new Set<string>();

  for (const file of evaluatedFiles) {
    const blockedPattern = findMatchingPattern(file.path, input.policy.scope.blocked_paths);

    if (blockedPattern) {
      findings.push({
        ruleId: "blocked_path",
        severity: "critical",
        message: `Blocked path changed: ${file.path}`,
        file: file.path,
        pattern: blockedPattern,
        score: riskScoreWeights.blockedPath,
      });
    }

    if (
      input.policy.scope.allowed_paths.length > 0 &&
      !matchesAnyPattern(file.path, input.policy.scope.allowed_paths)
    ) {
      findings.push({
        ruleId: "outside_allowed_paths",
        severity: "medium",
        message: `File changed outside allowed paths: ${file.path}`,
        file: file.path,
        score: riskScoreWeights.outsideAllowedPaths,
      });
    }

    const sensitivePattern = findMatchingPattern(file.path, input.policy.scope.sensitive_paths);

    if (sensitivePattern) {
      findings.push({
        ruleId: "sensitive_path",
        severity: "high",
        message: `Sensitive path changed: ${file.path}`,
        file: file.path,
        pattern: sensitivePattern,
        score: riskScoreWeights.sensitivePath,
      });
    }

    const testRequiredPattern = findMatchingPattern(
      file.path,
      input.policy.rules.require_tests_for,
    );

    if (testRequiredPattern && !testsChanged) {
      missingTestPatterns.add(testRequiredPattern);
    }

    if (input.policy.rules.block_secret_patterns) {
      for (const line of file.addedLines ?? []) {
        const secret = scanLineForSecret(line.content, line.lineNumber);

        if (secret) {
          findings.push({
            ruleId: "secret_pattern",
            severity: "critical",
            message: `Possible secret detected in ${file.path}`,
            file: file.path,
            pattern: secret.patternId,
            lineNumber: secret.lineNumber,
            preview: secret.preview,
            score: riskScoreWeights.secretPattern,
          });
        }
      }
    }
  }

  for (const pattern of missingTestPatterns) {
    findings.push({
      ruleId: "missing_tests",
      severity: "high",
      message: `Critical path changed without test update: ${pattern}`,
      pattern,
      score: riskScoreWeights.missingTests,
    });
  }

  const score = calculateRiskScore(findings);

  return {
    status: deriveStatus(findings),
    risk: deriveRiskLevel(score),
    score,
    findings,
    summary,
    evaluatedFiles,
  };
}

function deriveStatus(findings: PolicyFinding[]): PolicyStatus {
  if (findings.some((finding) => finding.severity === "critical")) {
    return "fail";
  }

  if (findings.length > 0) {
    return "warn";
  }

  return "pass";
}

function findMatchingPattern(path: string, patterns: string[]): string | undefined {
  return patterns.find((pattern) => matchesPattern(path, pattern));
}

function matchesAnyPattern(path: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(path, pattern));
}

function matchesPattern(path: string, pattern: string): boolean {
  const normalizedPath = normalizePath(path);
  const normalizedPattern = normalizePath(pattern);

  return picomatch.isMatch(normalizedPath, normalizedPattern, { dot: true });
}

function normalizePath(path: string): string {
  return path.replaceAll("\\", "/").replace(/^\.\/+/, "");
}

function isTestPath(path: string): boolean {
  const normalizedPath = normalizePath(path);

  return (
    matchesPattern(normalizedPath, "test/**") ||
    matchesPattern(normalizedPath, "tests/**") ||
    matchesPattern(normalizedPath, "**/__tests__/**") ||
    matchesPattern(normalizedPath, "**/*.test.ts") ||
    matchesPattern(normalizedPath, "**/*.test.tsx") ||
    matchesPattern(normalizedPath, "**/*.spec.ts") ||
    matchesPattern(normalizedPath, "**/*.spec.tsx")
  );
}
