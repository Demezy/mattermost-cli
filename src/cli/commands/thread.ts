import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import type { Post } from "../../api/types.ts"
import { globalArgs } from "../global-args.ts"
import { formatThread } from "../formatters.ts"
import { parseMattermostUrl } from "../../utils/url-parser.ts"
import { resolveUsers } from "../../utils/users.ts"

export default defineCommand({
  meta: {
    name: "thread",
    description: "Get a complete thread",
  },
  args: {
    ...globalArgs,
    "id-or-url": {
      type: "positional",
      description: "Thread root post ID or permalink URL",
      required: true,
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })

    let postId = args["id-or-url"]
    if (postId.startsWith("http")) {
      const parsed = parseMattermostUrl(postId)
      if (!parsed.postId) {
        console.error("Error: URL does not contain a post ID (expected permalink format)")
        process.exitCode = 1
        return
      }
      postId = parsed.postId
    }

    // Paginate: fetch all posts in the thread (API caps at 200 per request)
    const allPosts: Record<string, Post> = {}
    const perPage = 200
    let fromCreateAt: number | undefined
    let fromPost: string | undefined

    while (true) {
      const postList = await client.getPostThread(postId, { perPage, fromCreateAt, fromPost })
      const newPosts = Object.entries(postList.posts).filter(([id]) => !(id in allPosts))
      if (newPosts.length === 0) break
      for (const [id, post] of newPosts) {
        allPosts[id] = post
      }
      if (newPosts.length < perPage) break
      // Cursor to next page: use the latest post
      const sorted = newPosts.map(([, p]) => p).sort((a, b) => a.create_at - b.create_at)
      const last = sorted[sorted.length - 1]
      fromCreateAt = last.create_at
      fromPost = last.id
    }

    // Chronological order
    const orderedPosts = Object.values(allPosts).sort((a, b) => a.create_at - b.create_at)

    // Resolve unique authors
    const userIds = [...new Set(orderedPosts.map((p) => p.user_id))]
    const users = await resolveUsers(client, userIds)

    const entries = orderedPosts.map((post) => ({
      post,
      author: users.get(post.user_id) ?? null,
    }))

    console.log(formatThread(entries, { json: args.json }))
  },
})
