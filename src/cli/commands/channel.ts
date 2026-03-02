import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { resolveChannel } from "../../utils/channels.ts"

export default defineCommand({
  meta: {
    name: "channel",
    description: "Look up a channel",
  },
  args: {
    ...globalArgs,
    name: {
      type: "positional",
      description: "Channel name",
    },
    id: {
      type: "string",
      description: "Look up by channel ID instead of name",
    },
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
  },
  async run({ args }) {
    if (!args.name && !args.id) {
      console.error("Error: provide a channel name or use --id")
      process.exitCode = 1
      return
    }

    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })
    const teamId = args.team ?? config.teamId

    const channel = args.id
      ? await client.getChannel(args.id)
      : await resolveChannel(client, args.name!.replace(/^#/, ""), teamId)

    if (args.json) {
      console.log(JSON.stringify(channel))
    } else {
      const typeLabel: Record<string, string> = { O: "public", P: "private", D: "DM", G: "GM" }
      const lines: string[] = []
      lines.push(`${channel.display_name || channel.name} (${typeLabel[channel.type] ?? channel.type})`)
      lines.push(`ID: ${channel.id}`)
      if (channel.header) lines.push(`Header: ${channel.header}`)
      if (channel.purpose) lines.push(`Purpose: ${channel.purpose}`)
      lines.push(`Messages: ${channel.total_msg_count}`)
      console.log(lines.join("\n"))
    }
  },
})
