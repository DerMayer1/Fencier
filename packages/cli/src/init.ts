import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { defaultPolicyYaml } from "@fencier/core";
import { installAdapters } from "./adapters";

export type InitResult = {
  policyCreated: boolean;
  auditsCreated: boolean;
  adapterResult?: Awaited<ReturnType<typeof installAdapters>>;
};

export async function initializeFencier(input: {
  cwd: string;
  adapterSelection?: Parameters<typeof installAdapters>[0]["selection"];
  force?: boolean;
}): Promise<InitResult> {
  await mkdir(join(input.cwd, ".fencier", "audits"), { recursive: true });

  let policyCreated = false;

  try {
    await writeFile(join(input.cwd, "fencier.yaml"), defaultPolicyYaml, {
      encoding: "utf8",
      flag: input.force ? "w" : "wx",
    });
    policyCreated = true;
  } catch (error) {
    if (!isNodeError(error) || error.code !== "EEXIST") {
      throw error;
    }
  }

  const adapterResult = input.adapterSelection
    ? await installAdapters({
        cwd: input.cwd,
        selection: input.adapterSelection,
        force: input.force,
      })
    : undefined;

  return {
    policyCreated,
    auditsCreated: true,
    adapterResult,
  };
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
