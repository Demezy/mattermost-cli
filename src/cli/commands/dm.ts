import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "dm",
    description: "Send a direct message",
  },
  args: {
    ...globalArgs,
    username: {
      type: "positional",
      description: "Username to message",
      required: true,
    },
    message: {
      type: "positional",
      description: "Message to send",
      required: true,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without sending",
      default: false,
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

    const username = args.username.replace(/^@/, "")

    const [me, target] = await Promise.all([
      client.getMe(),
      client.getUserByUsername(username),
    ])

    if (args["dry-run"]) {
      const preview = {
        action: "dm",
        to: username,
        toId: target.id,
        message: args.message,
      }
      output(preview, `Would send DM to @${username}:\n${args.message}`, { json: args.json, fields: args.fields })
      return
    }

    const dmChannel = await client.createDirectChannel([me.id, target.id])

    const created = await client.createPost({
      channel_id: dmChannel.id,
      message: args.message,
    })

    output(
      { id: created.id, to: username, message: created.message },
      `DM sent to @${username} (${created.id})`,
      { json: args.json, fields: args.fields },
    )
  },
})
