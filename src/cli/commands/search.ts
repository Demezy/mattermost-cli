import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatPosts, postsToData } from "../formatters.ts"
import { resolveUsers } from "../../utils/users.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "search",
    description: "Search posts",
  },
  args: {
    ...globalArgs,
    query: {
      type: "positional",
      description: 'Search query. Supports Mattermost modifiers: from:user, in:channel, before:YYYY-MM-DD, after:YYYY-MM-DD. Example: "endpoint after:2026-03-17 from:d.nafikov in:monitoring". The --from and --channel flags are shortcuts for the from: and in: modifiers.',
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
    grep: {
      type: "string",
      description: "Filter posts by case-insensitive substring match on message content",
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

    let entries = orderedPosts.map((post) => ({
      post,
      author: users.get(post.user_id) ?? null,
    }))

    if (args.grep) {
      const pattern = args.grep.toLowerCase()
      entries = entries.filter((e) => e.post.message.toLowerCase().includes(pattern))
    }

    output(postsToData(entries), formatPosts(entries), { json: args.json, fields: args.fields })
  },
})
