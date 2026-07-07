import { describe, expect, it } from "vitest";
import {
  getChecklist,
  getPrompt,
  getSkill,
  listChecklists,
  listPrompts,
  listSkills,
  renderPrompt,
} from "./index";

describe("codex kit", () => {
  it("lists versioned prompts", () => {
    expect(listPrompts().map((prompt) => prompt.id)).toEqual([
      "implementation",
      "bugfix",
      "review",
      "refactor",
      "security",
      "fix-audit",
    ]);
  });

  it("renders prompts with local context", () => {
    const prompt = renderPrompt("implementation", {
      repoPath: "/repo",
      policyVersion: 1,
      latestAudit: "# Fencier Audit\n\nStatus: PASS",
    });

    expect(prompt).toContain("Repository: /repo");
    expect(prompt).toContain("Policy: fencier.yaml v1");
    expect(prompt).toContain("Fencier Codex Prompt: Implementation");
    expect(prompt).toContain("Run `fencier verify` before finishing.");
  });

  it("returns checklists and skills", () => {
    expect(listChecklists()).toHaveLength(6);
    expect(getChecklist("security").content).toContain("Secrets remain server-side");
    expect(listSkills()).toHaveLength(4);
    expect(getSkill("fencier-scope-control").content).toContain("AGENTS.md");
  });

  it("rejects unknown kit items", () => {
    expect(() => getPrompt("unknown")).toThrow("Unknown prompt");
    expect(() => getChecklist("unknown")).toThrow("Unknown checklist");
    expect(() => getSkill("unknown")).toThrow("Unknown skill");
  });
});
