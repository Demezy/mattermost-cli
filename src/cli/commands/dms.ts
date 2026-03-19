import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { resolveUsers } from "../../utils/users.ts"
import { output } from "../output.ts"

export function parseDuration(s: string): number {
  const match = s.match(/^(\d+)(h|d)$/)
  if (!match) throw new Error(`Invalid duration format: "${s}" (expected e.g. 24h, 7d)`)
  const [, n, unit] = match
  return unit === "h" ? Number(n) * 3600_000 : Number(n) * 86400_000
}

export function extractOtherUserId(channelName: string, myId: string): string {
  const parts = channelName.split("__")
  return parts[0] === myId ? parts[1] : parts[0]
}

export default defineCommand({
  meta: {
    name: "dms",
    description: "List DM conversations with activity metadata",
  },
  args: {
    ...globalArgs,
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
    since: {
      type: "string",
      description: "Only show DMs active within this duration (e.g. 24h, 7d)",
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

    const [channels, members, me] = await Promise.all([
      client.getChannelsForTeamForUser(teamId),
      client.getChannelMembersForUser(teamId),
      client.getMe(),
    ])

    // Filter to DM channels only
    const dmChannels = channels.filter((ch) => ch.type === "D")
    const memberMap = new Map(members.map((m) => [m.channel_id, m]))

    // Apply --since filter
    let filtered = dmChannels
    if (args.since) {
      const ms = parseDuration(args.since)
      const cutoff = Date.now() - ms
      filtered = filtered.filter((ch) => ch.last_post_at >= cutoff)
    }

    // Extract other user IDs and resolve
    const otherUserIds = [...new Set(filtered.map((ch) => extractOtherUserId(ch.name, me.id)))]
    const users = await resolveUsers(client, otherUserIds)

    // Sort by last_post_at descending
    filtered.sort((a, b) => b.last_post_at - a.last_post_at)

    const data = filtered.map((ch) => {
      const member = memberMap.get(ch.id)
      const otherUserId = extractOtherUserId(ch.name, me.id)
      const user = users.get(otherUserId)
      const unread = member ? ch.total_msg_count_root - member.msg_count_root : 0
      const mentions = member?.mention_count_root ?? 0
      return {
        channel_id: ch.id,
        user_id: otherUserId,
        username: user?.username ?? "",
        display_name: [user?.first_name, user?.last_name].filter(Boolean).join(" "),
        last_post_at: new Date(ch.last_post_at).toISOString(),
        msg_count: ch.total_msg_count_root,
        unread: Math.max(0, unread),
        mentions,
      }
    })

    if (args.json) {
      output(data, "", { json: true, fields: args.fields })
      return
    }

    if (data.length === 0) {
      console.log("No DM conversations found")
      return
    }

    const lines = ["Username\tLast Active\tUnread\tMentions"]
    for (const d of data) {
      const lastActive = d.last_post_at.slice(0, 16).replace("T", " ")
      lines.push(`${d.username || d.user_id}\t${lastActive}\t${d.unread}\t${d.mentions}`)
    }
    console.log(lines.join("\n"))
  },
})
