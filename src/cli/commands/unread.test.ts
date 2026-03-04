import { describe, it, expect } from "bun:test"
import type { Channel, ChannelMember } from "../../api/types.ts"

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: "ch1",
    team_id: "t1",
    type: "O",
    display_name: "Town Square",
    name: "town-square",
    header: "",
    purpose: "",
    create_at: 0,
    update_at: 0,
    delete_at: 0,
    total_msg_count: 100,
    last_post_at: 0,
    ...overrides,
  }
}

function makeMember(overrides: Partial<ChannelMember> = {}): ChannelMember {
  return {
    channel_id: "ch1",
    user_id: "u1",
    msg_count: 90,
    mention_count: 0,
    last_viewed_at: 0,
    last_update_at: 0,
    ...overrides,
  }
}

describe("unread muted filtering", () => {
  it("filters out muted channels by default", () => {
    const members: ChannelMember[] = [
      makeMember({ channel_id: "ch1", msg_count: 90 }),
      makeMember({ channel_id: "ch2", msg_count: 90, notify_props: { mark_unread: "mention" } }),
    ]
    const channels: Channel[] = [
      makeChannel({ id: "ch1", display_name: "General" }),
      makeChannel({ id: "ch2", display_name: "Muted Channel", total_msg_count: 100 }),
    ]

    const channelMap = new Map(channels.map((ch) => [ch.id, ch]))
    const showMuted = false

    const unread: Array<{ channel: Channel; unreadCount: number; mentionCount: number; muted: boolean }> = []
    for (const member of members) {
      const channel = channelMap.get(member.channel_id)
      if (!channel) continue
      const muted = member.notify_props?.mark_unread === "mention"
      if (muted && !showMuted) continue
      const unreadCount = channel.total_msg_count - member.msg_count
      if (unreadCount <= 0 && member.mention_count <= 0) continue
      unread.push({ channel, unreadCount, mentionCount: member.mention_count, muted })
    }

    expect(unread).toHaveLength(1)
    expect(unread[0].channel.id).toBe("ch1")
  })

  it("includes muted channels when --show-muted is set", () => {
    const members: ChannelMember[] = [
      makeMember({ channel_id: "ch1", msg_count: 90 }),
      makeMember({ channel_id: "ch2", msg_count: 90, notify_props: { mark_unread: "mention" } }),
    ]
    const channels: Channel[] = [
      makeChannel({ id: "ch1", display_name: "General" }),
      makeChannel({ id: "ch2", display_name: "Muted Channel", total_msg_count: 100 }),
    ]

    const channelMap = new Map(channels.map((ch) => [ch.id, ch]))
    const showMuted = true

    const unread: Array<{ channel: Channel; unreadCount: number; mentionCount: number; muted: boolean }> = []
    for (const member of members) {
      const channel = channelMap.get(member.channel_id)
      if (!channel) continue
      const muted = member.notify_props?.mark_unread === "mention"
      if (muted && !showMuted) continue
      const unreadCount = channel.total_msg_count - member.msg_count
      if (unreadCount <= 0 && member.mention_count <= 0) continue
      unread.push({ channel, unreadCount, mentionCount: member.mention_count, muted })
    }

    expect(unread).toHaveLength(2)
    expect(unread.find((u) => u.channel.id === "ch2")?.muted).toBe(true)
  })

  it("includes muted field in JSON output shape", () => {
    const member = makeMember({ channel_id: "ch1", msg_count: 90 })
    const channel = makeChannel({ id: "ch1" })
    const muted = member.notify_props?.mark_unread === "mention"

    const jsonEntry = {
      id: channel.id,
      name: channel.display_name || channel.name,
      type: channel.type,
      unread: channel.total_msg_count - member.msg_count,
      mentions: member.mention_count,
      muted,
    }

    expect(jsonEntry).toHaveProperty("muted")
    expect(jsonEntry.muted).toBe(false)
  })
})
