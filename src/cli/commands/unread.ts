import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"

export default defineCommand({
  meta: {
    name: "unread",
    description: "Show channels with unread posts",
  },
  args: {
    ...globalArgs,
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
    "show-muted": {
      type: "boolean",
      description: "Include muted channels (hidden by default)",
      default: false,
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const teamId = args.team ?? config.teamId
    if (!teamId) {
      console.error("Error: MM_TEAM_ID is required for this command (or pass --team)")
      process.exitCode = 1
      return
    }

    const client = createClient({ url: config.url, token: config.token })

    const [channels, members] = await Promise.all([
      client.getChannelsForTeamForUser(teamId),
      client.getChannelMembersForUser(teamId),
    ])

    const channelMap = new Map(channels.map((ch) => [ch.id, ch]))

    const unread: Array<{ channel: typeof channels[0]; unreadCount: number; mentionCount: number; muted: boolean }> = []

    for (const member of members) {
      const channel = channelMap.get(member.channel_id)
      if (!channel) continue
      const muted = member.notify_props?.mark_unread === "mention"
      if (muted && !args["show-muted"]) continue
      const unreadCount = channel.total_msg_count - member.msg_count
      if (unreadCount <= 0 && member.mention_count <= 0) continue
      unread.push({ channel, unreadCount, mentionCount: member.mention_count, muted })
    }

    // Sort by mention count (desc), then unread count (desc)
    unread.sort((a, b) => b.mentionCount - a.mentionCount || b.unreadCount - a.unreadCount)

    if (args.json) {
      console.log(
        JSON.stringify(
          unread.map((u) => ({
            id: u.channel.id,
            name: u.channel.display_name || u.channel.name,
            type: u.channel.type,
            unread: u.unreadCount,
            mentions: u.mentionCount,
            muted: u.muted,
          })),
        ),
      )
      return
    }

    if (unread.length === 0) {
      console.log("No unread channels")
      return
    }

    const typeLabel: Record<string, string> = { O: "public", P: "private", D: "DM", G: "GM" }
    console.log("Channel\tType\tUnread\tMentions")
    for (const { channel, unreadCount, mentionCount } of unread) {
      const name = channel.display_name || channel.name
      const type = typeLabel[channel.type] ?? channel.type
      console.log(`${name}\t${type}\t${unreadCount}\t${mentionCount}`)
    }
  },
})
