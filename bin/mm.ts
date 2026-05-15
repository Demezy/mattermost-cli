#!/usr/bin/env bun
import { runCommand, showUsage } from "citty"
import { mainCommand } from "../src/cli/index.ts"
import { MattermostApiError, ReadOnlyError } from "../src/api/errors.ts"
import { exitCodeForError } from "../src/cli/exit-codes.ts"
import { outputError } from "../src/cli/output.ts"

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

function errorToCode(err: unknown): string {
  if (err instanceof ReadOnlyError) return "read_only"
  if (err instanceof MattermostApiError) {
    if (err.mattermostErrorId) return err.mattermostErrorId
    if (err.statusCode === 401) return "auth_error"
    if (err.statusCode === 403) return "permission_denied"
    if (err.statusCode === 404) return "not_found"
    if (err.statusCode >= 500) return "server_error"
    return "api_error"
  }
  if (err instanceof Error && err.message.includes("Missing required environment variable")) return "config_error"
  return "error"
}

function errorToHint(err: unknown): string | undefined {
  if (err instanceof ReadOnlyError) return "Unset MM_READ_ONLY or set it to false"
  if (err instanceof MattermostApiError) {
    if (err.statusCode === 401) return "Check that MM_TOKEN is valid"
    if (err.statusCode === 404) return "Verify the resource ID or name exists"
  }
  if (err instanceof Error && err.message.includes("Missing required environment variable"))
    return "Set MM_URL and MM_TOKEN environment variables"
  return undefined
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
  const jsonMode = rawArgs.includes("--json")

  // Show usage for CLI-level errors (no command, unknown command)
  const isUsageError =
    err instanceof Error &&
    (err.message.includes("No command specified") || err.message.includes("Unknown command"))

  if (isUsageError && !jsonMode) {
    await showUsage(mainCommand)
    console.error("")
  }

  const message = err instanceof Error ? err.message : "An unexpected error occurred"
  const code = errorToCode(err)
  const hint = errorToHint(err)
  const statusCode = err instanceof MattermostApiError ? err.statusCode : undefined
  const mattermostErrorId = err instanceof MattermostApiError ? err.mattermostErrorId : undefined

  if (jsonMode) {
    outputError({ code, message, hint, statusCode, mattermostErrorId }, true)
  } else {
    if (err instanceof MattermostApiError) {
      console.error(`API Error: ${err.message} (HTTP ${err.statusCode})`)
      if (err.mattermostErrorId) {
        console.error(`  Error ID: ${err.mattermostErrorId}`)
      }
    } else {
      console.error(`Error: ${message}`)
    }
    if (hint) console.error(`  Hint: ${hint}`)
  }

  if (verbose && err instanceof Error && err.stack) {
    console.error(err.stack)
  }

  process.exit(exitCodeForError(err))
}
