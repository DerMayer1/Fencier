import { describe, expect, it } from "vitest";
import {
  createHealthCheck,
  deriveRiskLevel,
  evaluatePolicy,
  maskSecretLine,
  parsePolicyConfig,
  riskScoreWeights,
} from "./index";

describe("createHealthCheck", () => {
  it("returns the package health state", () => {
    expect(createHealthCheck()).toEqual({
      name: "fencier",
      status: "ready",
    });
  });
});

describe("parsePolicyConfig", () => {
  it("parses a minimal policy with defaults", () => {
    const policy = parsePolicyConfig("version: 1\n");

    expect(policy.version).toBe(1);
    expect(policy.rules.max_files_changed).toBe(8);
    expect(policy.audit.include_patch).toBe(false);
  });
});

describe("evaluatePolicy", () => {
  it("passes when changed files stay within policy", () => {
    const policy = parsePolicyConfig(`
version: 1
scope:
  allowed_paths:
    - src/**
rules:
  max_files_changed: 2
  max_lines_changed: 20
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: "src/index.ts",
          status: "modified",
          additions: 3,
          deletions: 1,
        },
      ],
    });

    expect(result.status).toBe("pass");
    expect(result.risk).toBe("low");
    expect(result.score).toBe(0);
    expect(result.findings).toEqual([]);
  });

  it("fails when a blocked path changes", () => {
    const policy = parsePolicyConfig(`
version: 1
scope:
  blocked_paths:
    - .env
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: ".env",
          status: "modified",
          additions: 1,
          deletions: 0,
        },
      ],
    });

    expect(result.status).toBe("fail");
    expect(result.risk).toBe("high");
    expect(result.score).toBe(50);
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "blocked_path",
        severity: "critical",
        file: ".env",
      }),
    );
  });

  it("warns on sensitive paths and ignores ignored paths", () => {
    const policy = parsePolicyConfig(`
version: 1
scope:
  sensitive_paths:
    - src/auth/**
  ignored_paths:
    - dist/**
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: "src/auth/session.ts",
          status: "modified",
          additions: 4,
          deletions: 2,
        },
        {
          path: "dist/bundle.js",
          status: "modified",
          additions: 500,
          deletions: 0,
        },
      ],
    });

    expect(result.status).toBe("warn");
    expect(result.summary.filesChanged).toBe(1);
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]).toEqual(
      expect.objectContaining({
        ruleId: "sensitive_path",
        file: "src/auth/session.ts",
      }),
    );
  });

  it("detects possible secrets in added lines without exposing the full value", () => {
    const policy = parsePolicyConfig(`
version: 1
rules:
  block_secret_patterns: true
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: "src/config.ts",
          status: "modified",
          additions: 1,
          deletions: 0,
          addedLines: [
            {
              lineNumber: 7,
              content: "OPENAI_API_KEY=sk-1234567890abcdefghijklmnop",
            },
          ],
        },
      ],
    });

    expect(result.status).toBe("fail");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "secret_pattern",
        severity: "critical",
        lineNumber: 7,
        preview: "sk-1...redacted",
      }),
    );
    expect(JSON.stringify(result.findings)).not.toContain("abcdefghijklmnop");
  });

  it("warns when critical paths change without tests", () => {
    const policy = parsePolicyConfig(`
version: 1
rules:
  require_tests_for:
    - src/auth/**
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: "src/auth/session.ts",
          status: "modified",
          additions: 8,
          deletions: 2,
        },
      ],
    });

    expect(result.status).toBe("warn");
    expect(result.findings).toContainEqual(
      expect.objectContaining({
        ruleId: "missing_tests",
        severity: "high",
        pattern: "src/auth/**",
      }),
    );
  });

  it("does not warn for critical paths when tests are changed", () => {
    const policy = parsePolicyConfig(`
version: 1
rules:
  require_tests_for:
    - src/auth/**
`);

    const result = evaluatePolicy({
      policy,
      files: [
        {
          path: "src/auth/session.ts",
          status: "modified",
          additions: 8,
          deletions: 2,
        },
        {
          path: "src/auth/session.test.ts",
          status: "modified",
          additions: 4,
          deletions: 1,
        },
      ],
    });

    expect(result.findings).not.toContainEqual(
      expect.objectContaining({
        ruleId: "missing_tests",
      }),
    );
  });
});

describe("maskSecretLine", () => {
  it("masks assignment values", () => {
    expect(maskSecretLine("API_KEY=sk-1234567890")).toBe("API_KEY=sk-1...redacted");
  });
});

describe("risk scoring", () => {
  it("keeps risk thresholds explicit", () => {
    expect(deriveRiskLevel(0)).toBe("low");
    expect(deriveRiskLevel(20)).toBe("medium");
    expect(deriveRiskLevel(50)).toBe("high");
    expect(deriveRiskLevel(90)).toBe("critical");
  });

  it("keeps finding weights centralized", () => {
    expect(riskScoreWeights).toMatchObject({
      blockedPath: 50,
      secretPattern: 50,
      sensitivePath: 25,
      missingTests: 25,
    });
  });
});
