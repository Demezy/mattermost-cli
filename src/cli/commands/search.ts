import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatPosts } from "../formatters.ts"
import { resolveUsers } from "../../utils/users.ts"

export default defineCommand({
  meta: {
    name: "search",
    description: "Search posts",
  },
  args: {
    ...globalArgs,
    query: {
      type: "positional",
      description: "Search query (supports Mattermost search syntax: from:, in:, before:, after:)",
      required: true,
    },
    channel: {
      type: "string",
      description: "Filter by channel name (adds in: prefix)",
    },
    from: {
      type: "string",
      description: "Filter by username (adds from: prefix)",
    },
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const teamId = args.team ?? config.teamId
    if (!teamId) {
      console.error("Error: MM_TEAM_ID is required for search (or pass --team)")
      process.exitCode = 1
      return
    }

    const client = createClient({ url: config.url, token: config.token })

    // Build search terms with optional filters
    const parts: string[] = []
    if (args.channel) parts.push(`in:${args.channel}`)
    if (args.from) parts.push(`from:${args.from}`)
    parts.push(args.query)
    const terms = parts.join(" ")

    const postList = await client.searchPosts(teamId, terms)

    // Chronological order
    const orderedPosts = postList.order
      .map((id) => postList.posts[id])
      .sort((a, b) => a.create_at - b.create_at)

    const userIds = [...new Set(orderedPosts.map((p) => p.user_id))]
    const users = await resolveUsers(client, userIds)

    const entries = orderedPosts.map((post) => ({
      post,
      author: users.get(post.user_id) ?? null,
    }))

    console.log(formatPosts(entries, { json: args.json }))
  },
})
