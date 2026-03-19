import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatPosts, postsToData } from "../formatters.ts"
import { resolveUsers } from "../../utils/users.ts"
import { resolveChannel } from "../../utils/channels.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "posts",
    description: "List recent posts in a channel",
  },
  args: {
    ...globalArgs,
    channel: {
      type: "positional",
      description: "Channel name or ID",
      required: true,
    },
    limit: {
      type: "string",
      description: "Max posts to return (default: 50, max: 200)",
    },
    since: {
      type: "string",
      description: "Fetch posts since this date (ISO 8601)",
    },
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
    grep: {
      type: "string",
      description: "Filter posts by case-insensitive substring match on message content",
    },
    "roots-only": {
      type: "boolean",
      description: "Only show root posts (exclude replies)",
      default: false,
    },
    from: {
      type: "string",
      description: "Filter by author username",
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })
    const teamId = args.team ?? config.teamId

    const channel = await resolveChannel(client, args.channel, teamId)

    const perPage = Math.min(Number(args.limit) || 50, 200)
    const since = args.since ? new Date(args.since).getTime() : undefined

    const postList = await client.getPosts(channel.id, { perPage, since })

    // Chronological order (API returns newest first)
    const orderedPosts = postList.order
      .map((id) => postList.posts[id])
      .reverse()

    // Filter to root posts only if requested
    const filtered = args["roots-only"]
      ? orderedPosts.filter((p) => !p.root_id)
      : orderedPosts

    // Resolve unique authors
    const userIds = [...new Set(filtered.map((p) => p.user_id))]
    const users = await resolveUsers(client, userIds)

    let entries = filtered.map((post) => ({
      post,
      author: users.get(post.user_id) ?? null,
    }))

    if (args.from) {
      const target = args.from.toLowerCase()
      entries = entries.filter((e) => e.author?.username.toLowerCase() === target)
    }

    if (args.grep) {
      const pattern = args.grep.toLowerCase()
      entries = entries.filter((e) => e.post.message.toLowerCase().includes(pattern))
    }

    output(postsToData(entries), formatPosts(entries), { json: args.json, fields: args.fields })
  },
})
