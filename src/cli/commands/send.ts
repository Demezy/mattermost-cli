import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { resolveChannel } from "../../utils/channels.ts"

export default defineCommand({
  meta: {
    name: "send",
    description: "Create a root post in a channel",
  },
  args: {
    ...globalArgs,
    channel: {
      type: "positional",
      description: "Channel name or ID",
      required: true,
    },
    message: {
      type: "positional",
      description: "Message to post",
      required: true,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without posting",
      default: false,
    },
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
  },
  async run({ args }) {
    if (!args.message) {
      console.error("Error: message cannot be empty")
      process.exitCode = 1
      return
    }

    const config = loadConnectionConfig()
    const readOnly = process.env["MM_READ_ONLY"] === "true"
    const client = createClient({ url: config.url, token: config.token, readOnly })
    const teamId = args.team ?? config.teamId

    const channel = await resolveChannel(client, args.channel, teamId)

    if (args["dry-run"]) {
      const preview = {
        action: "send",
        channelId: channel.id,
        channelName: channel.name,
        message: args.message,
      }
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would post to #${channel.name} (${channel.id}):`)
        console.log(args.message)
      }
      return
    }

    const created = await client.createPost({
      channel_id: channel.id,
      message: args.message,
    })

    if (args.json) {
      console.log(JSON.stringify({ id: created.id, message: created.message }))
    } else {
      console.log(`Message posted to #${channel.name} (${created.id})`)
    }
  },
})
