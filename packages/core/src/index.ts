export type { DiffFile, DiffFileStatus, DiffLine, DiffSummary } from "./diff";
export { summarizeDiff } from "./diff";
export type {
  EvaluatePolicyInput,
  FindingSeverity,
  PolicyFinding,
  PolicyResult,
  PolicyStatus,
} from "./evaluate";
export { evaluatePolicy } from "./evaluate";
export type { FencierPolicy } from "./policy";
export {
  defaultPolicy,
  defaultPolicyYaml,
  fencierPolicySchema,
  parsePolicyConfig,
} from "./policy";
export type { RiskLevel } from "./risk";
export { calculateRiskScore, deriveRiskLevel, riskScoreWeights } from "./risk";
export type { SecretFinding, SecretPatternId } from "./secrets";
export { maskSecretLine, scanLineForSecret } from "./secrets";

export type FencierHealthStatus = "ready";

export type FencierHealthCheck = {
  name: "fencier";
  status: FencierHealthStatus;
};

export function createHealthCheck(): FencierHealthCheck {
  return {
    name: "fencier",
    status: "ready",
  };
}
