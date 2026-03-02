import { runCommand, showUsage } from "citty"
import { mainCommand } from "../src/cli/index.ts"
import { MattermostApiError, ReadOnlyError } from "../src/api/errors.ts"

const rawArgs = process.argv.slice(2)

async function resolveSubCommandForHelp(): Promise<
  [cmd: Parameters<typeof showUsage>[0], parent?: Parameters<typeof showUsage>[1]]
> {
  const subCommandName = rawArgs.find((arg) => !arg.startsWith("-"))
  if (subCommandName && mainCommand.subCommands) {
    const resolver = (mainCommand.subCommands as Record<string, unknown>)[subCommandName]
    if (resolver) {
      const subCmd = typeof resolver === "function" ? await resolver() : await resolver
      return [subCmd, mainCommand]
    }
  }
  return [mainCommand]
}

try {
  if (rawArgs.includes("--help") || rawArgs.includes("-h")) {
    const resolved = await resolveSubCommandForHelp()
    await showUsage(...resolved)
    process.exit(0)
  }

  if (rawArgs.length === 1 && rawArgs[0] === "--version") {
    const meta = mainCommand.meta as { version?: string } | undefined
    console.log(meta?.version ?? "unknown")
    process.exit(0)
  }

  await runCommand(mainCommand, { rawArgs })
} catch (err: unknown) {
  const verbose = rawArgs.includes("--verbose")

  // Show usage for CLI-level errors (no command, unknown command)
  const isUsageError =
    err instanceof Error &&
    (err.message.includes("No command specified") || err.message.includes("Unknown command"))

  if (isUsageError) {
    await showUsage(mainCommand)
    console.error("")
  }

  if (err instanceof ReadOnlyError) {
    console.error(`Error: ${err.message}`)
  } else if (err instanceof MattermostApiError) {
    console.error(`API Error: ${err.message} (HTTP ${err.statusCode})`)
    if (err.mattermostErrorId) {
      console.error(`  Error ID: ${err.mattermostErrorId}`)
    }
  } else if (err instanceof Error) {
    console.error(`Error: ${err.message}`)
  } else {
    console.error("An unexpected error occurred")
  }

  if (verbose && err instanceof Error && err.stack) {
    console.error(err.stack)
  }

  process.exit(1)
}
