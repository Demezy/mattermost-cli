import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"

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
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would edit post ${args["post-id"]}:`)
        console.log(args.message)
      }
      return
    }

    const updated = await client.patchPost(args["post-id"], { message: args.message })

    if (args.json) {
      console.log(JSON.stringify({ id: updated.id, message: updated.message }))
    } else {
      console.log(`Post edited (${updated.id})`)
    }
  },
})
