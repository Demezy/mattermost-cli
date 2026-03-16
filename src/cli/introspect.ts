import { mainCommand } from "./index.ts"
import { globalArgs } from "./global-args.ts"
import { commandAnnotations, type AgentAnnotations } from "./command-meta.ts"
import type { CommandDef } from "citty"

export interface ArgSchema {
  name: string
  type: string
  description: string
  required: boolean
  default?: unknown
  alias?: string
}

export interface CommandSchema {
  name: string
  description: string
  args: ArgSchema[]
  annotations: AgentAnnotations
}

export interface EnvVarSchema {
  name: string
  required: boolean
  description: string
}

export interface ToolManifest {
  name: string
  version: string
  description: string
  commands: CommandSchema[]
  globalArgs: ArgSchema[]
  envVars: EnvVarSchema[]
}

const globalArgNames = new Set(Object.keys(globalArgs))

function extractArgs(cmd: CommandDef): ArgSchema[] {
  const args = cmd.args
  if (!args) return []
  const result: ArgSchema[] = []
  for (const [name, def] of Object.entries(args)) {
    if (globalArgNames.has(name)) continue
    const d = def as Record<string, unknown>
    result.push({
      name,
      type: d["type"] as string ?? "string",
      description: d["description"] as string ?? "",
      required: !!(d["required"]),
      ...(d["default"] !== undefined ? { default: d["default"] } : {}),
      ...(d["alias"] ? { alias: d["alias"] as string } : {}),
    })
  }
  return result
}

function extractGlobalArgs(): ArgSchema[] {
  return Object.entries(globalArgs).map(([name, def]) => ({
    name,
    type: def.type,
    description: def.description,
    required: false,
    ...("default" in def ? { default: def.default } : {}),
  }))
}

/** Eagerly load all subcommands and build a full manifest. */
export async function buildManifest(): Promise<ToolManifest> {
  const meta = (mainCommand.meta ?? {}) as { name?: string; version?: string; description?: string }
  const subCommands = mainCommand.subCommands as Record<string, (() => Promise<CommandDef>) | CommandDef>

  const commands: CommandSchema[] = []
  for (const [name, resolver] of Object.entries(subCommands)) {
    const cmd = typeof resolver === "function" ? await resolver() : resolver
    const cmdMeta = (cmd.meta ?? {}) as { name?: string; description?: string }
    const annotations = commandAnnotations[name] ?? { readOnly: false, destructive: false, idempotent: false }
    commands.push({
      name: cmdMeta.name ?? name,
      description: cmdMeta.description ?? "",
      args: extractArgs(cmd),
      annotations,
    })
  }

  commands.sort((a, b) => a.name.localeCompare(b.name))

  return {
    name: meta.name ?? "mm",
    version: meta.version ?? "unknown",
    description: meta.description ?? "",
    commands,
    globalArgs: extractGlobalArgs(),
    envVars: [
      { name: "MM_URL", required: true, description: "Mattermost server base URL" },
      { name: "MM_TOKEN", required: true, description: "Personal access token" },
      { name: "MM_TEAM_ID", required: false, description: "Team ID (required for channel-scoped commands)" },
      { name: "MM_READ_ONLY", required: false, description: "Set true to block write operations" },
    ],
  }
}

/** Render the manifest as Markdown for AGENTS.md. */
export function manifestToMarkdown(manifest: ToolManifest): string {
  const lines: string[] = []

  lines.push(`# ${manifest.name} v${manifest.version}`)
  lines.push("")
  lines.push(manifest.description)
  lines.push("")

  // Env vars
  lines.push("## Environment Variables")
  lines.push("")
  lines.push("| Variable | Required | Description |")
  lines.push("|----------|----------|-------------|")
  for (const v of manifest.envVars) {
    lines.push(`| \`${v.name}\` | ${v.required ? "Yes" : "No"} | ${v.description} |`)
  }
  lines.push("")

  // Global flags
  lines.push("## Global Flags")
  lines.push("")
  lines.push("| Flag | Type | Default | Description |")
  lines.push("|------|------|---------|-------------|")
  for (const a of manifest.globalArgs) {
    const def = a.default !== undefined ? String(a.default) : "-"
    lines.push(`| \`--${a.name}\` | ${a.type} | ${def} | ${a.description} |`)
  }
  lines.push("")

  // Commands
  lines.push("## Commands")
  lines.push("")

  for (const cmd of manifest.commands) {
    lines.push(`### ${manifest.name} ${cmd.name}`)
    lines.push("")
    lines.push(cmd.description)
    lines.push("")

    // Annotations
    const tags: string[] = []
    if (cmd.annotations.readOnly) tags.push("Read-only")
    else tags.push("Write")
    if (cmd.annotations.destructive) tags.push("Destructive")
    if (cmd.annotations.idempotent) tags.push("Idempotent")
    else tags.push("Not idempotent")
    lines.push(tags.join(" | "))
    lines.push("")

    if (cmd.args.length > 0) {
      lines.push("| Argument | Type | Required | Default | Description |")
      lines.push("|----------|------|----------|---------|-------------|")
      for (const a of cmd.args) {
        const nameCol = a.type === "positional" ? `\`<${a.name}>\`` : `\`--${a.name}\``
        const def = a.default !== undefined ? String(a.default) : "-"
        lines.push(`| ${nameCol} | ${a.type} | ${a.required ? "yes" : "no"} | ${def} | ${a.description} |`)
      }
      lines.push("")
    }

    lines.push("---")
    lines.push("")
  }

  return lines.join("\n")
}
