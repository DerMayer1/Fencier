import { parse as parseYaml } from "yaml";
import { z } from "zod";

const pathPatternsSchema = z.array(z.string().min(1)).default([]);

export const fencierPolicySchema = z.object({
  version: z.literal(1).default(1),
  scope: z
    .object({
      allowed_paths: pathPatternsSchema,
      blocked_paths: pathPatternsSchema,
      sensitive_paths: pathPatternsSchema,
      ignored_paths: pathPatternsSchema,
    })
    .default({}),
  rules: z
    .object({
      max_files_changed: z.number().int().positive().default(8),
      max_lines_changed: z.number().int().positive().default(500),
      block_secret_patterns: z.boolean().default(true),
      require_tests_for: pathPatternsSchema,
    })
    .default({}),
  audit: z
    .object({
      write_markdown: z.boolean().default(true),
      write_json: z.boolean().default(true),
      include_patch: z.boolean().default(false),
    })
    .default({}),
  adapters: z
    .object({
      codex: z.boolean().default(true),
      claude: z.boolean().default(false),
      cursor: z.boolean().default(false),
      copilot: z.boolean().default(false),
    })
    .default({}),
});

export type FencierPolicy = z.infer<typeof fencierPolicySchema>;

export const defaultPolicy: FencierPolicy = fencierPolicySchema.parse({});

export const defaultPolicyYaml = `version: 1

scope:
  allowed_paths:
    - .github/workflows/**
    - .gitignore
    - AGENTS.md
    - LICENSE
    - README.md
    - biome.json
    - fencier.yaml
    - package.json
    - pnpm-lock.yaml
    - pnpm-workspace.yaml
    - tsconfig.base.json
    - vitest.config.ts
    - src/**
    - packages/**
    - apps/**
    - tests/**
    - docs/**
  blocked_paths:
    - .env
    - .env.*
    - secrets/**
  sensitive_paths:
    - src/auth/**
    - src/billing/**
    - src/payments/**
    - .github/workflows/**
    - infra/**
    - migrations/**
  ignored_paths:
    - dist/**
    - build/**
    - coverage/**
    - node_modules/**

rules:
  max_files_changed: 8
  max_lines_changed: 500
  block_secret_patterns: true
  require_tests_for:
    - src/auth/**
    - src/billing/**
    - src/payments/**

audit:
  write_markdown: true
  write_json: true
  include_patch: false

adapters:
  codex: true
  claude: false
  cursor: false
  copilot: false
`;

export function parsePolicyConfig(input: string): FencierPolicy {
  const parsed = parseYaml(input) ?? {};
  return fencierPolicySchema.parse(parsed);
}
