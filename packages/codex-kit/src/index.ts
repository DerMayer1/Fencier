export type CodexPromptId =
  | "implementation"
  | "bugfix"
  | "review"
  | "refactor"
  | "security"
  | "fix-audit";

export type CodexChecklistId = CodexPromptId;

export type CodexSkillId =
  | "fencier-scope-control"
  | "fencier-implementation"
  | "fencier-review"
  | "fencier-fix-audit";

export type CodexKitItem<TId extends string> = {
  id: TId;
  title: string;
  description: string;
  content: string;
};

export type PromptRenderInput = {
  repoPath?: string;
  policyVersion?: number;
  latestAudit?: string;
};

const commonPromptRules = [
  "Read the user request, AGENTS.md, and fencier.yaml before editing.",
  "Keep the change inside the user request and configured Fencier boundaries.",
  "Do not perform opportunistic refactors or unrelated cleanup.",
  "Do not move secrets, tokens, or API keys into client-side code.",
  "Run `fencier verify` before finishing.",
  "If verification fails, fix only the findings or report remaining risk explicitly.",
];

const prompts = [
  {
    id: "implementation",
    title: "Implementation",
    description: "Use when Codex needs to implement a scoped feature or change.",
    content: promptTemplate(
      "Implementation",
      [
        "Implement only the requested behavior.",
        "Inspect the smallest relevant file set before editing.",
        "Add or update tests when critical logic changes.",
        "Keep public interfaces stable unless the request requires changing them.",
      ],
      ["files changed", "tests run", "verification result", "remaining risk"],
    ),
  },
  {
    id: "bugfix",
    title: "Bugfix",
    description: "Use when Codex needs to diagnose and fix a concrete defect.",
    content: promptTemplate(
      "Bugfix",
      [
        "Reproduce or explain the failure before editing when possible.",
        "Fix the smallest root cause, not nearby symptoms.",
        "Add a regression test when the project has a matching test surface.",
        "Avoid broad rewrites unless the defect cannot be isolated.",
      ],
      ["root cause", "fix summary", "tests run", "verification result"],
    ),
  },
  {
    id: "review",
    title: "Review",
    description: "Use when Codex should inspect changes without editing by default.",
    content: promptTemplate(
      "Review",
      [
        "Prioritize correctness, security, regression risk, and missing tests.",
        "Report findings with file and line references.",
        "Do not rewrite code unless explicitly asked.",
        "Keep summaries secondary to actionable findings.",
      ],
      ["findings", "open questions", "test gaps", "verification result if run"],
    ),
  },
  {
    id: "refactor",
    title: "Refactor",
    description: "Use when Codex should improve structure without changing behavior.",
    content: promptTemplate(
      "Refactor",
      [
        "Preserve behavior and public contracts.",
        "Keep the refactor scoped to the requested area.",
        "Do not mix feature work with refactoring.",
        "Run existing tests or explain why they were not available.",
      ],
      ["behavior preserved", "files changed", "tests run", "verification result"],
    ),
  },
  {
    id: "security",
    title: "Security Pass",
    description: "Use when Codex should inspect or harden security-sensitive code.",
    content: promptTemplate(
      "Security Pass",
      [
        "Identify trust boundaries, secrets, auth, payments, CI/CD, and data flows.",
        "Prefer server-side secret handling.",
        "Do not print or persist secret values.",
        "Fix only validated or plausible issues in scope.",
      ],
      ["security findings", "fixes made", "tests run", "remaining risk"],
    ),
  },
  {
    id: "fix-audit",
    title: "Fix Latest Audit",
    description: "Use after `fencier verify` fails and Codex must correct findings.",
    content: promptTemplate(
      "Fix Latest Audit",
      [
        "Read the latest Fencier audit before editing.",
        "Fix only the listed findings.",
        "Do not suppress policy rules to make verification pass.",
        "Re-run `fencier verify` after changes.",
      ],
      ["audit findings fixed", "tests run", "new verification result", "remaining risk"],
    ),
  },
] as const satisfies readonly CodexKitItem<CodexPromptId>[];

const checklists = [
  checklist("implementation", "Implementation Checklist", [
    "Request and scope are restated in concrete terms.",
    "Relevant files were inspected before editing.",
    "No unrelated refactor or cleanup was introduced.",
    "Tests were added or updated when behavior changed.",
    "`fencier verify` was run before final response.",
  ]),
  checklist("bugfix", "Bugfix Checklist", [
    "Failure mode is understood or explicitly described.",
    "Fix targets the smallest root cause.",
    "Regression coverage was added when practical.",
    "No adjacent behavior was changed without request.",
    "`fencier verify` was run before final response.",
  ]),
  checklist("review", "Review Checklist", [
    "Findings are ordered by severity.",
    "Each finding has a concrete file reference.",
    "Missing tests and residual risk are called out.",
    "No code was edited unless requested.",
    "Summary is shorter than findings.",
  ]),
  checklist("refactor", "Refactor Checklist", [
    "Behavior is intended to remain unchanged.",
    "Public contracts are preserved.",
    "Scope is limited to requested files/modules.",
    "Tests or typechecks cover the changed area.",
    "`fencier verify` was run before final response.",
  ]),
  checklist("security", "Security Checklist", [
    "Trust boundaries and sensitive data paths were inspected.",
    "Secrets remain server-side and masked in output.",
    "Auth, payments, CI/CD, and infra changes are justified.",
    "Security fixes are scoped and testable.",
    "`fencier verify` was run before final response.",
  ]),
  checklist("fix-audit", "Fix Audit Checklist", [
    "Latest audit was read before editing.",
    "Only audit findings were addressed.",
    "Policy was not weakened to pass verification.",
    "A new verification run was completed.",
    "Remaining risk was reported if verification still fails.",
  ]),
] as const satisfies readonly CodexKitItem<CodexChecklistId>[];

const skills = [
  {
    id: "fencier-scope-control",
    title: "Fencier Scope Control",
    description: "Keeps Codex work inside the user request and Fencier policy boundary.",
    content: skillTemplate(
      "Fencier Scope Control",
      "Use when a Codex task may drift into unrelated files, refactors, or sensitive paths.",
      [
        "Read the user request, AGENTS.md, and fencier.yaml.",
        "Identify allowed, blocked, and sensitive paths before editing.",
        "Reject opportunistic cleanup unless explicitly requested.",
        "Before finishing, run `fencier verify` and report the result.",
      ],
    ),
  },
  {
    id: "fencier-implementation",
    title: "Fencier Implementation",
    description: "Guides scoped implementation work in a Fencier-governed repository.",
    content: skillTemplate(
      "Fencier Implementation",
      "Use when implementing a requested feature or code change.",
      [
        "Map the smallest relevant file set.",
        "Edit only files required by the request.",
        "Add focused tests when behavior changes.",
        "Run project checks and `fencier verify` before final response.",
      ],
    ),
  },
  {
    id: "fencier-review",
    title: "Fencier Review",
    description: "Guides review-only Codex sessions with findings-first output.",
    content: skillTemplate(
      "Fencier Review",
      "Use when reviewing a diff or repository area without editing by default.",
      [
        "Prioritize bugs, regressions, security risk, and missing tests.",
        "Anchor findings to file references.",
        "Keep summaries short and secondary.",
        "Mention whether `fencier verify` was run or why it was not.",
      ],
    ),
  },
  {
    id: "fencier-fix-audit",
    title: "Fencier Fix Audit",
    description: "Guides Codex when correcting findings from the latest Fencier audit.",
    content: skillTemplate(
      "Fencier Fix Audit",
      "Use after `fencier verify` fails and the task is to correct only those findings.",
      [
        "Read `fencier audit show latest`.",
        "Fix only listed findings.",
        "Do not weaken fencier.yaml unless explicitly requested.",
        "Run `fencier verify` again and report the new result.",
      ],
    ),
  },
] as const satisfies readonly CodexKitItem<CodexSkillId>[];

export function listPrompts(): CodexKitItem<CodexPromptId>[] {
  return prompts.map((prompt) => ({ ...prompt }));
}

export function getPrompt(id: string): CodexKitItem<CodexPromptId> {
  return getItem(prompts, id, "prompt");
}

export function renderPrompt(id: string, input: PromptRenderInput = {}): string {
  const prompt = getPrompt(id);
  const context = renderPromptContext(input);

  return context ? `${context}\n\n${prompt.content}` : prompt.content;
}

export function listChecklists(): CodexKitItem<CodexChecklistId>[] {
  return checklists.map((checklist) => ({ ...checklist }));
}

export function getChecklist(id: string): CodexKitItem<CodexChecklistId> {
  return getItem(checklists, id, "checklist");
}

export function listSkills(): CodexKitItem<CodexSkillId>[] {
  return skills.map((skill) => ({ ...skill }));
}

export function getSkill(id: string): CodexKitItem<CodexSkillId> {
  return getItem(skills, id, "skill");
}

function getItem<TId extends string>(
  items: readonly CodexKitItem<TId>[],
  id: string,
  kind: string,
): CodexKitItem<TId> {
  const item = items.find((candidate) => candidate.id === id);

  if (!item) {
    throw new Error(`Unknown ${kind}: ${id}`);
  }

  return { ...item };
}

function promptTemplate(title: string, rules: string[], finalResponse: string[]): string {
  return [
    `# Fencier Codex Prompt: ${title}`,
    "",
    "You are working inside a Fencier-governed repository.",
    "",
    "## Operating Rules",
    "",
    ...commonPromptRules.map((rule) => `- ${rule}`),
    "",
    "## Task Rules",
    "",
    ...rules.map((rule) => `- ${rule}`),
    "",
    "## Final Response Must Include",
    "",
    ...finalResponse.map((item) => `- ${item}`),
    "",
  ].join("\n");
}

function checklist(
  id: CodexChecklistId,
  title: string,
  items: string[],
): CodexKitItem<CodexChecklistId> {
  return {
    id,
    title,
    description: `Checklist for ${title.toLowerCase()}.`,
    content: [`# ${title}`, "", ...items.map((item) => `- [ ] ${item}`), ""].join("\n"),
  };
}

function skillTemplate(title: string, trigger: string, workflow: string[]): string {
  return [
    `# ${title}`,
    "",
    `Trigger: ${trigger}`,
    "",
    "## Workflow",
    "",
    ...workflow.map((step, index) => `${index + 1}. ${step}`),
    "",
    "## Completion",
    "",
    "Report files changed, tests run, Fencier verification result, and remaining risk.",
    "",
  ].join("\n");
}

function renderPromptContext(input: PromptRenderInput): string {
  const lines = ["# Local Context", ""];

  if (input.repoPath) {
    lines.push(`Repository: ${input.repoPath}`);
  }

  if (input.policyVersion) {
    lines.push(`Policy: fencier.yaml v${input.policyVersion}`);
  }

  if (input.latestAudit) {
    lines.push("", "## Latest Audit", "", input.latestAudit.trim());
  }

  return lines.length > 2 ? lines.join("\n") : "";
}
