import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { promisify } from "node:util";
import type { DiffFile, DiffFileStatus, DiffLine } from "@fencier/core";

const execFileAsync = promisify(execFile);

export type GitDiffOptions = {
  cwd: string;
  staged?: boolean;
  base?: string;
};

export async function isInsideGitRepo(cwd: string): Promise<boolean> {
  try {
    const result = await execGit(cwd, ["rev-parse", "--is-inside-work-tree"]);
    return result.trim() === "true";
  } catch {
    return false;
  }
}

export async function getGitBranch(cwd: string): Promise<string | undefined> {
  try {
    return (await execGit(cwd, ["branch", "--show-current"])).trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function getGitCommit(cwd: string): Promise<string | undefined> {
  try {
    return (await execGit(cwd, ["rev-parse", "--short", "HEAD"])).trim() || undefined;
  } catch {
    return undefined;
  }
}

export async function collectGitDiff(options: GitDiffOptions): Promise<DiffFile[]> {
  if (!options.staged && !options.base && !(await hasGitHead(options.cwd))) {
    return collectUntrackedFiles(options.cwd);
  }

  const numstat = await execGit(options.cwd, [...createDiffArgs(options), "--numstat"]);
  const nameStatus = await execGit(options.cwd, [...createDiffArgs(options), "--name-status"]);
  const patch = await execGit(options.cwd, [...createDiffArgs(options), "--unified=0"]);
  const statusByPath = parseNameStatus(nameStatus);
  const addedLinesByPath = parseAddedLines(patch);
  const trackedFiles = parseNumstat(numstat).map((file) => ({
    ...file,
    status: statusByPath.get(file.path) ?? "unknown",
    addedLines: addedLinesByPath.get(file.path) ?? [],
  }));

  if (options.staged || options.base) {
    return trackedFiles;
  }

  return [...trackedFiles, ...(await collectUntrackedFiles(options.cwd))];
}

async function execGit(cwd: string, args: string[]): Promise<string> {
  const result = await execFileAsync("git", args, {
    cwd,
    windowsHide: true,
  });

  return result.stdout;
}

async function hasGitHead(cwd: string): Promise<boolean> {
  try {
    await execGit(cwd, ["rev-parse", "--verify", "HEAD"]);
    return true;
  } catch {
    return false;
  }
}

function createDiffArgs(options: GitDiffOptions): string[] {
  if (options.base) {
    return ["diff", `${options.base}...HEAD`];
  }

  if (options.staged) {
    return ["diff", "--staged"];
  }

  return ["diff", "HEAD"];
}

function parseNumstat(output: string): Omit<DiffFile, "status">[] {
  return output
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) => {
      const [additions, deletions, ...pathParts] = line.split("\t");
      const path = pathParts.join("\t");

      return {
        path: normalizeGitPath(path),
        additions: parseGitCount(additions),
        deletions: parseGitCount(deletions),
      };
    });
}

function parseNameStatus(output: string): Map<string, DiffFileStatus> {
  const statuses = new Map<string, DiffFileStatus>();

  for (const line of output.split(/\r?\n/).filter(Boolean)) {
    const [rawStatus, ...pathParts] = line.split("\t");
    const status = parseGitStatus(rawStatus);
    const path = pathParts.at(-1);

    if (path) {
      statuses.set(normalizeGitPath(path), status);
    }
  }

  return statuses;
}

async function collectUntrackedFiles(cwd: string): Promise<DiffFile[]> {
  const output = await execGit(cwd, ["ls-files", "--others", "--exclude-standard"]);
  const paths = output.split(/\r?\n/).filter(Boolean);

  return Promise.all(
    paths.map(async (path) => ({
      path: normalizeGitPath(path),
      status: "added" as const,
      additions: await countFileLines(join(cwd, path)),
      deletions: 0,
      addedLines: await readFileLines(join(cwd, path)),
    })),
  );
}

function parseAddedLines(patch: string): Map<string, DiffLine[]> {
  const addedLinesByPath = new Map<string, DiffLine[]>();
  let currentPath: string | undefined;
  let newLineNumber: number | undefined;

  for (const line of patch.split(/\r?\n/)) {
    if (line.startsWith("+++ b/")) {
      currentPath = normalizeGitPath(line.slice("+++ b/".length));
      if (!addedLinesByPath.has(currentPath)) {
        addedLinesByPath.set(currentPath, []);
      }
      continue;
    }

    if (line.startsWith("@@")) {
      newLineNumber = parseHunkNewLineStart(line);
      continue;
    }

    if (!currentPath || newLineNumber === undefined) {
      continue;
    }

    if (line.startsWith("+") && !line.startsWith("+++")) {
      addedLinesByPath.get(currentPath)?.push({
        lineNumber: newLineNumber,
        content: line.slice(1),
      });
      newLineNumber += 1;
      continue;
    }

    if (!line.startsWith("-") && !line.startsWith("\\")) {
      newLineNumber += 1;
    }
  }

  return addedLinesByPath;
}

function parseGitCount(value: string | undefined): number {
  if (!value || value === "-") {
    return 0;
  }

  return Number.parseInt(value, 10);
}

function parseGitStatus(value: string | undefined): DiffFileStatus {
  if (!value) {
    return "unknown";
  }

  if (value.startsWith("R")) {
    return "renamed";
  }

  if (value.startsWith("A")) {
    return "added";
  }

  if (value.startsWith("D")) {
    return "deleted";
  }

  if (value.startsWith("M")) {
    return "modified";
  }

  return "unknown";
}

async function countFileLines(path: string): Promise<number> {
  try {
    const contents = await readFile(path, "utf8");

    if (contents.length === 0) {
      return 0;
    }

    return contents.split(/\r?\n/).length;
  } catch {
    return 0;
  }
}

async function readFileLines(path: string): Promise<DiffLine[]> {
  try {
    const contents = await readFile(path, "utf8");

    if (contents.length === 0) {
      return [];
    }

    return contents.split(/\r?\n/).map((content, index) => ({
      lineNumber: index + 1,
      content,
    }));
  } catch {
    return [];
  }
}

function parseHunkNewLineStart(line: string): number | undefined {
  const match = /\+(\d+)/u.exec(line);

  if (!match?.[1]) {
    return undefined;
  }

  return Number.parseInt(match[1], 10);
}

function normalizeGitPath(path: string): string {
  return path.replaceAll("\\", "/");
}
