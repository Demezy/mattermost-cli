import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "edit",
    description: "Edit your own post",
  },
  args: {
    ...globalArgs,
    "post-id": {
      type: "positional",
      description: "Post ID to edit",
      required: true,
    },
    message: {
      type: "positional",
      description: "New message content",
      required: true,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without editing",
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

    if (args["dry-run"]) {
      const preview = {
        action: "edit",
        postId: args["post-id"],
        message: args.message,
      }
      output(preview, `Would edit post ${args["post-id"]}:\n${args.message}`, { json: args.json, fields: args.fields })
      return
    }

    const updated = await client.patchPost(args["post-id"], { message: args.message })

    output(
      { id: updated.id, message: updated.message },
      `Post edited (${updated.id})`,
      { json: args.json, fields: args.fields },
    )
  },
})
