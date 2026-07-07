import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { AdapterId, AgentAdapter } from "@fencier/adapters";
import { isAdapterId, resolveAdapterSelection } from "@fencier/adapters";

export type AdapterInstallSelection = AdapterId | "all";

export type AdapterInstallResult = {
  installed: AgentAdapter[];
  conflicts: AgentAdapter[];
};

export function parseAdapterInstallSelection(value: string): AdapterInstallSelection {
  if (value === "all") {
    return value;
  }

  if (isAdapterId(value)) {
    return value;
  }

  throw new Error(`Unknown adapter: ${value}`);
}

export async function installAdapters(input: {
  cwd: string;
  selection: AdapterInstallSelection;
  force?: boolean;
}): Promise<AdapterInstallResult> {
  const selected = resolveAdapterSelection(input.selection);
  const conflicts = input.force ? [] : await findExistingAdapters(input.cwd, selected);

  if (conflicts.length > 0) {
    return {
      installed: [],
      conflicts,
    };
  }

  for (const adapter of selected) {
    const targetPath = join(input.cwd, adapter.targetPath);
    await mkdir(dirname(targetPath), { recursive: true });
    await writeFile(targetPath, adapter.content, "utf8");
  }

  return {
    installed: selected,
    conflicts: [],
  };
}

async function findExistingAdapters(
  cwd: string,
  adapters: AgentAdapter[],
): Promise<AgentAdapter[]> {
  const conflicts: AgentAdapter[] = [];

  for (const adapter of adapters) {
    try {
      await access(join(cwd, adapter.targetPath));
      conflicts.push(adapter);
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        continue;
      }

      throw error;
    }
  }

  return conflicts;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
