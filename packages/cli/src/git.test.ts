import { execFile } from "node:child_process";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { describe, expect, it } from "vitest";
import { collectGitDiff } from "./git";

const execFileAsync = promisify(execFile);

describe("collectGitDiff", () => {
  it("collects untracked files when the repository has no HEAD yet", async () => {
    const cwd = await mkdtemp(join(tmpdir(), "fencier-unborn-git-test-"));
    await execFileAsync("git", ["init"], { cwd, windowsHide: true });
    await writeFile(join(cwd, "fencier.yaml"), "version: 1\n", "utf8");

    const files = await collectGitDiff({ cwd });

    expect(files).toContainEqual(
      expect.objectContaining({
        path: "fencier.yaml",
        status: "added",
      }),
    );
  });
});
