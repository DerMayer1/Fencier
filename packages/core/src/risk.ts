export type RiskLevel = "low" | "medium" | "high" | "critical";

export type RiskScoredSignal = {
  score: number;
};

export const riskScoreWeights = {
  blockedPath: 50,
  secretPattern: 50,
  sensitivePath: 25,
  missingTests: 25,
  maxFilesChanged: 15,
  maxLinesChanged: 15,
  outsideAllowedPaths: 15,
} as const;

export function calculateRiskScore(findings: RiskScoredSignal[]): number {
  return Math.min(
    100,
    findings.reduce((total, finding) => total + finding.score, 0),
  );
}

export function deriveRiskLevel(score: number): RiskLevel {
  if (score >= 90) {
    return "critical";
  }

  if (score >= 50) {
    return "high";
  }

  if (score >= 20) {
    return "medium";
  }

  return "low";
}
