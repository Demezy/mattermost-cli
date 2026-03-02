import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"

export default defineCommand({
  meta: {
    name: "delete",
    description: "Delete your own post",
  },
  args: {
    ...globalArgs,
    "post-id": {
      type: "positional",
      description: "Post ID to delete",
      required: true,
    },
    confirm: {
      type: "boolean",
      description: "Confirm deletion (required)",
      default: false,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without deleting",
      default: false,
    },
  },
  async run({ args }) {
    if (!args.confirm) {
      console.error("Error: pass --confirm to delete a post")
      process.exitCode = 1
      return
    }

    if (args["dry-run"]) {
      const preview = { action: "delete", postId: args["post-id"] }
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would delete post ${args["post-id"]}`)
      }
      return
    }

    const config = loadConnectionConfig()
    const readOnly = process.env["MM_READ_ONLY"] === "true"
    const client = createClient({ url: config.url, token: config.token, readOnly })

    await client.deletePost(args["post-id"])

    if (args.json) {
      console.log(JSON.stringify({ id: args["post-id"], deleted: true }))
    } else {
      console.log(`Post deleted (${args["post-id"]})`)
    }
  },
})
