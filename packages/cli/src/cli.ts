import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { listAdapters } from "@fencier/adapters";
import {
  createHealthCheck,
  defaultPolicyYaml,
  evaluatePolicy,
  parsePolicyConfig,
} from "@fencier/core";
import { Command } from "commander";
import { installAdapters, parseAdapterInstallSelection } from "./adapters";
import { listAuditFiles, readLatestAuditMarkdown, writeAuditReports } from "./audit";
import { createCodexBrief } from "./codex";
import { collectGitDiff, getGitBranch, getGitCommit, isInsideGitRepo } from "./git";
import { formatCheckResult } from "./output";

export function createProgram(): Command {
  const program = new Command();

  program
    .name("fencier")
    .description("Local-first boundary layer for AI coding agents")
    .version("0.0.0");

  program
    .command("doctor")
    .description("Check that the Fencier CLI is wired correctly")
    .action(() => {
      const health = createHealthCheck();
      console.log(`${health.name}: ${health.status}`);
    });

  program
    .command("init")
    .description("Create fencier.yaml and the local Fencier workspace")
    .option("--codex", "Install the primary Codex AGENTS.md contract")
    .option("--adapter <id>", "Install one adapter after initialization")
    .option("--all-adapters", "Install all supported compatibility adapters after initialization")
    .option("--force", "Overwrite an existing fencier.yaml")
    .action(
      async (options: {
        codex?: boolean;
        adapter?: string;
        allAdapters?: boolean;
        force?: boolean;
      }) => {
        const cwd = process.cwd();
        let adapterSelection: ReturnType<typeof parseAdapterInstallSelection> | undefined;

        if (options.codex || options.adapter || options.allAdapters) {
          try {
            adapterSelection = resolveInitAdapterSelection(options);
          } catch (error) {
            console.error(error instanceof Error ? error.message : String(error));
            process.exitCode = 3;
            return;
          }
        }

        if (!(await isInsideGitRepo(cwd))) {
          console.error("Fencier init must be run inside a git repository.");
          process.exitCode = 3;
          return;
        }

        await mkdir(join(cwd, ".fencier", "audits"), { recursive: true });

        const policyPath = join(cwd, "fencier.yaml");

        try {
          await writeFile(policyPath, defaultPolicyYaml, {
            encoding: "utf8",
            flag: options.force ? "w" : "wx",
          });
        } catch (error) {
          if (isNodeError(error) && error.code === "EEXIST") {
            console.error("fencier.yaml already exists. Re-run with --force to overwrite it.");
            process.exitCode = 3;
            return;
          }

          throw error;
        }

        console.log("Created fencier.yaml");
        console.log("Created .fencier/audits");

        if (adapterSelection) {
          const result = await installAdapters({
            cwd,
            selection: adapterSelection,
            force: options.force,
          });

          printAdapterInstallResult(result);
        }
      },
    );

  program
    .command("check")
    .description("Alias for `verify`; evaluate the current git diff against fencier.yaml")
    .option("--staged", "Evaluate staged changes only")
    .option("--base <ref>", "Evaluate changes against a base ref")
    .option("--no-audit", "Skip writing local audit reports")
    .action(runVerification);

  program
    .command("verify")
    .description("Run deterministic verification for the current Codex-produced diff")
    .option("--staged", "Verify staged changes only")
    .option("--base <ref>", "Verify changes against a base ref")
    .option("--no-audit", "Skip writing local audit reports")
    .action(runVerification);

  const audit = program.command("audit").description("Inspect local Fencier audit reports");

  audit
    .command("list")
    .description("List local audit report files")
    .action(async () => {
      const audits = await listAuditFiles(process.cwd());

      if (audits.length === 0) {
        console.log("No audits found.");
        return;
      }

      for (const audit of audits) {
        console.log(audit);
      }
    });

  audit
    .command("show")
    .argument("<id>", "Audit id or 'latest'")
    .description("Show an audit report")
    .action(async (id: string) => {
      if (id !== "latest") {
        console.error("Only `fencier audit show latest` is supported in this version.");
        process.exitCode = 3;
        return;
      }

      const latest = await readLatestAuditMarkdown(process.cwd());

      if (!latest) {
        console.log("No audits found.");
        return;
      }

      console.log(latest);
    });

  const codex = program.command("codex").description("Codex CLI integration helpers");

  codex
    .command("install")
    .description("Install the Codex AGENTS.md adapter")
    .option("--force", "Overwrite an existing AGENTS.md")
    .action(async (options: { force?: boolean }) => {
      const result = await installAdapters({
        cwd: process.cwd(),
        selection: "codex",
        force: options.force,
      });

      printAdapterInstallResult(result);
    });

  codex
    .command("brief")
    .description("Print a deterministic project brief for a Codex CLI session")
    .action(async () => {
      console.log(await createCodexBrief(process.cwd()));
    });

  const adapters = program.command("adapters").description("Manage agent adapter files");

  adapters
    .command("list")
    .description("List supported agent adapters")
    .action(() => {
      for (const adapter of listAdapters()) {
        console.log(
          `${adapter.id}\t${adapter.role}\t${adapter.targetPath}\t${adapter.description}`,
        );
      }
    });

  adapters
    .command("install")
    .argument("<adapter>", "Adapter id or 'all'")
    .option("--force", "Overwrite existing adapter files")
    .description("Install agent adapter instruction files")
    .action(async (adapter: string, options: { force?: boolean }) => {
      let selection: ReturnType<typeof parseAdapterInstallSelection>;

      try {
        selection = parseAdapterInstallSelection(adapter);
      } catch (error) {
        console.error(error instanceof Error ? error.message : String(error));
        process.exitCode = 3;
        return;
      }

      const result = await installAdapters({
        cwd: process.cwd(),
        selection,
        force: options.force,
      });

      printAdapterInstallResult(result);
    });

  return program;
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}

function resolveInitAdapterSelection(options: {
  codex?: boolean;
  adapter?: string;
  allAdapters?: boolean;
}): ReturnType<typeof parseAdapterInstallSelection> {
  const selectedModes = [options.codex, Boolean(options.adapter), options.allAdapters].filter(
    Boolean,
  );

  if (selectedModes.length > 1) {
    throw new Error(
      "Choose only one adapter initialization mode: --codex, --adapter, or --all-adapters.",
    );
  }

  if (options.codex) {
    return "codex";
  }

  if (options.allAdapters) {
    return "all";
  }

  return parseAdapterInstallSelection(options.adapter as string);
}

async function runVerification(options: {
  staged?: boolean;
  base?: string;
  audit?: boolean;
}): Promise<void> {
  const cwd = process.cwd();

  if (!(await isInsideGitRepo(cwd))) {
    console.error("Fencier verification must be run inside a git repository.");
    process.exitCode = 3;
    return;
  }

  let policyText: string;

  try {
    policyText = await readFile(join(cwd, "fencier.yaml"), "utf8");
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      console.error("Missing fencier.yaml. Run `fencier init` first.");
      process.exitCode = 3;
      return;
    }

    throw error;
  }

  const policy = parsePolicyConfig(policyText);
  const files = await collectGitDiff({
    cwd,
    staged: options.staged,
    base: options.base,
  });
  const result = evaluatePolicy({ policy, files });

  console.log(formatCheckResult(result));

  if (options.audit !== false) {
    const written = await writeAuditReports({
      cwd,
      policy,
      result,
      repo: {
        path: cwd,
        branch: await getGitBranch(cwd),
        commit: await getGitCommit(cwd),
      },
    });

    if (written.markdownPath) {
      console.log("");
      console.log(`Audit report: ${written.markdownPath}`);
    }
  }

  if (result.status === "fail") {
    process.exitCode = 1;
  }
}

function printAdapterInstallResult(result: Awaited<ReturnType<typeof installAdapters>>): void {
  if (result.conflicts.length > 0) {
    console.error("Adapter files already exist. Re-run with --force to overwrite:");

    for (const conflict of result.conflicts) {
      console.error(`- ${conflict.targetPath}`);
    }

    process.exitCode = 3;
    return;
  }

  for (const adapter of result.installed) {
    console.log(`Installed ${adapter.id}: ${adapter.targetPath}`);
  }
}
