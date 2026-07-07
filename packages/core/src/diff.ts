export type DiffFileStatus = "added" | "modified" | "deleted" | "renamed" | "unknown";

export type DiffFile = {
  path: string;
  status: DiffFileStatus;
  additions: number;
  deletions: number;
  addedLines?: DiffLine[];
};

export type DiffLine = {
  lineNumber?: number;
  content: string;
};

export type DiffSummary = {
  filesChanged: number;
  linesAdded: number;
  linesRemoved: number;
  totalLinesChanged: number;
};

export function summarizeDiff(files: DiffFile[]): DiffSummary {
  const linesAdded = files.reduce((total, file) => total + file.additions, 0);
  const linesRemoved = files.reduce((total, file) => total + file.deletions, 0);

  return {
    filesChanged: files.length,
    linesAdded,
    linesRemoved,
    totalLinesChanged: linesAdded + linesRemoved,
  };
}
