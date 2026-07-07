export type AdapterId = "codex" | "claude" | "cursor" | "copilot";

export type AgentAdapter = {
  id: AdapterId;
  name: string;
  targetPath: string;
  role: "primary" | "compatibility";
  description: string;
  content: string;
};

const sharedRules = [
  "Stay within the user's requested scope.",
  "Prefer the smallest correct change.",
  "Do not perform opportunistic refactors.",
  "Do not edit sensitive files unless the user explicitly asked for it.",
  "Do not move secrets, tokens, or API keys into client-side code.",
  "Do not print secrets in logs, tests, examples, or final messages.",
  "If auth, billing, payments, migrations, CI/CD, or infra files change, explain why.",
  "If critical logic changes, update tests or explain why tests were not changed.",
  "Before finishing, summarize files changed and notable risk.",
  "Recommend running `fencier verify` before committing.",
];

const markdownTemplate = (title: string): string => `# ${title}

This repository uses Fencier to keep AI coding agents inside the task.

Follow these rules:

${sharedRules.map((rule) => `- ${rule}`).join("\n")}
`;

const codexTemplate = `# Fencier Agent Rules

This repository uses Fencier as the local boundary layer for Codex CLI work.

Priority:

- The user request is the source of truth.
- This file defines the operating contract for Codex in this repository.
- fencier.yaml defines the deterministic verification boundary.

Codex CLI workflow:

1. Read the user request, this file, and fencier.yaml before editing.
2. Keep changes inside the requested scope and configured Fencier boundaries.
3. Do not perform opportunistic refactors or unrelated cleanup.
4. Run \`fencier verify\` before finishing.
5. If \`fencier verify\` fails, fix the findings or report the remaining risk explicitly.

Follow these rules:

${sharedRules.map((rule) => `- ${rule}`).join("\n")}
`;

const cursorTemplate = `# Fencier Agent Rules

This repository uses Fencier to keep AI coding agents inside the task.

${sharedRules.map((rule) => `- ${rule}`).join("\n")}
`;

const adapters = [
  {
    id: "codex",
    name: "Codex",
    targetPath: "AGENTS.md",
    role: "primary",
    description: "Repository instructions for Codex CLI sessions.",
    content: codexTemplate,
  },
  {
    id: "claude",
    name: "Claude Code",
    targetPath: "CLAUDE.md",
    role: "compatibility",
    description: "Repository instructions for Claude Code.",
    content: markdownTemplate("Fencier Agent Rules"),
  },
  {
    id: "cursor",
    name: "Cursor",
    targetPath: ".cursorrules",
    role: "compatibility",
    description: "Cursor project rules.",
    content: cursorTemplate,
  },
  {
    id: "copilot",
    name: "GitHub Copilot",
    targetPath: ".github/copilot-instructions.md",
    role: "compatibility",
    description: "GitHub Copilot repository instructions.",
    content: markdownTemplate("Fencier Copilot Instructions"),
  },
] as const satisfies readonly AgentAdapter[];

export function listAdapters(): AgentAdapter[] {
  return adapters.map((adapter) => ({ ...adapter }));
}

export function getAdapter(id: AdapterId): AgentAdapter {
  const adapter = adapters.find((candidate) => candidate.id === id);

  if (!adapter) {
    throw new Error(`Unknown adapter: ${id}`);
  }

  return { ...adapter };
}

export function isAdapterId(value: string): value is AdapterId {
  return adapters.some((adapter) => adapter.id === value);
}

export function resolveAdapterSelection(selection: AdapterId | "all"): AgentAdapter[] {
  if (selection === "all") {
    return listAdapters();
  }

  return [getAdapter(selection)];
}

export function getPrimaryAdapter(): AgentAdapter {
  return getAdapter("codex");
}
