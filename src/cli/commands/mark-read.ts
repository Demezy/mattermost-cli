import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { resolveChannel } from "../../utils/channels.ts"
import { globalArgs } from "../global-args.ts"

export default defineCommand({
  meta: {
    name: "mark-read",
    description: "Mark a channel or thread as read",
  },
  args: {
    ...globalArgs,
    target: {
      type: "positional",
      description: "Channel name, ID, or thread root post ID",
      required: true,
    },
    thread: {
      type: "boolean",
      alias: "t",
      description: "Treat target as a thread root post ID",
      default: false,
    },
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without marking as read",
      default: false,
    },
  },
  async run({ args }) {
    const target = args.target

    if (args["dry-run"]) {
      const mode = args.thread ? "thread" : "channel"
      const preview = { action: "mark-read", mode, target }
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would mark ${mode} ${target} as read`)
      }
      return
    }

    const config = loadConnectionConfig()
    const readOnly = process.env["MM_READ_ONLY"] === "true"
    const client = createClient({ url: config.url, token: config.token, readOnly })
    const teamId = args.team ?? config.teamId

    const me = await client.getMe()

    if (args.thread) {
      if (!teamId) {
        console.error("Error: MM_TEAM_ID is required for thread mark-read (or pass --team)")
        process.exitCode = 1
        return
      }
      await client.markThreadAsRead(me.id, teamId, target, Date.now())
      if (args.json) {
        console.log(JSON.stringify({ status: "ok", mode: "thread", target }))
      } else {
        console.log(`Marked thread ${target} as read`)
      }
    } else {
      const channel = await resolveChannel(client, target, teamId)
      await client.viewChannel(me.id, channel.id)
      if (args.json) {
        console.log(JSON.stringify({ status: "ok", mode: "channel", target, channelId: channel.id }))
      } else {
        const name = channel.display_name || channel.name
        console.log(`Marked channel ${name} as read`)
      }
    }
  },
})
