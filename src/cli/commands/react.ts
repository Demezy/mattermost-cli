import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"

export default defineCommand({
  meta: {
    name: "react",
    description: "Add a reaction to a post",
  },
  args: {
    ...globalArgs,
    "post-id": {
      type: "positional",
      description: "Post ID to react to",
      required: true,
    },
    emoji: {
      type: "positional",
      description: "Emoji name (e.g. thumbsup, heart)",
      required: true,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview without reacting",
      default: false,
    },
  },
  async run({ args }) {
    // Strip surrounding colons: ":thumbsup:" -> "thumbsup"
    const emoji = args.emoji.replace(/^:+|:+$/g, "")

    if (args["dry-run"]) {
      const preview = { action: "react", postId: args["post-id"], emoji }
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would react with :${emoji}: on post ${args["post-id"]}`)
      }
      return
    }

    const config = loadConnectionConfig()
    const readOnly = process.env["MM_READ_ONLY"] === "true"
    const client = createClient({ url: config.url, token: config.token, readOnly })

    const me = await client.getMe()

    const reaction = await client.addReaction({
      user_id: me.id,
      post_id: args["post-id"],
      emoji_name: emoji,
    })

    if (args.json) {
      console.log(JSON.stringify(reaction))
    } else {
      console.log(`Reacted with :${emoji}: on post ${args["post-id"]}`)
    }
  },
})
