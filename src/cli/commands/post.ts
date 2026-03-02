import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatPost, formatPosts } from "../formatters.ts"

export default defineCommand({
  meta: {
    name: "post",
    description: "Get a single post with its author",
  },
  args: {
    ...globalArgs,
    id: {
      type: "positional",
      description: "Post ID",
      required: true,
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })

    const post = await client.getPost(args.id)
    let author = null
    try {
      author = await client.getUser(post.user_id)
    } catch {
      // author stays null
    }

    if (args.json) {
      console.log(formatPosts([{ post, author }], { json: true }))
    } else {
      console.log(formatPost(post, author))
    }
  },
})
