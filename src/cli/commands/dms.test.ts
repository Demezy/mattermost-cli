import { describe, it, expect } from "bun:test"
import { parseDuration, extractOtherUserId } from "./dms.ts"
import type { Channel, ChannelMember } from "../../api/types.ts"

describe("parseDuration", () => {
  it("parses hours", () => {
    expect(parseDuration("24h")).toBe(24 * 3600_000)
    expect(parseDuration("1h")).toBe(3600_000)
  })

  it("parses days", () => {
    expect(parseDuration("7d")).toBe(7 * 86400_000)
    expect(parseDuration("1d")).toBe(86400_000)
  })

  it("rejects invalid formats", () => {
    expect(() => parseDuration("abc")).toThrow("Invalid duration format")
    expect(() => parseDuration("24m")).toThrow("Invalid duration format")
    expect(() => parseDuration("")).toThrow("Invalid duration format")
    expect(() => parseDuration("h")).toThrow("Invalid duration format")
  })
})

describe("extractOtherUserId", () => {
  it("returns the other user when my ID is first", () => {
    expect(extractOtherUserId("me123__other456", "me123")).toBe("other456")
  })

  it("returns the other user when my ID is second", () => {
    expect(extractOtherUserId("other456__me123", "me123")).toBe("other456")
  })
})

function makeChannel(overrides: Partial<Channel> = {}): Channel {
  return {
    id: "ch1",
    team_id: "t1",
    type: "D",
    display_name: "",
    name: "u1__u2",
    header: "",
    purpose: "",
    create_at: 0,
    update_at: 0,
    delete_at: 0,
    total_msg_count: 100,
    total_msg_count_root: 100,
    last_post_at: 1710850000000,
    ...overrides,
  } as Channel
}

function makeMember(overrides: Partial<ChannelMember> = {}): ChannelMember {
  return {
    channel_id: "ch1",
    user_id: "u1",
    msg_count: 90,
    msg_count_root: 90,
    mention_count: 0,
    mention_count_root: 0,
    last_viewed_at: 0,
    last_update_at: 0,
    ...overrides,
  } as ChannelMember
}

describe("DM channel filtering", () => {
  it("filters to type D only", () => {
    const channels = [
      makeChannel({ id: "ch1", type: "D" }),
      makeChannel({ id: "ch2", type: "O" }),
      makeChannel({ id: "ch3", type: "D" }),
      makeChannel({ id: "ch4", type: "G" }),
    ]
    const dms = channels.filter((ch) => ch.type === "D")
    expect(dms).toHaveLength(2)
    expect(dms.map((ch) => ch.id)).toEqual(["ch1", "ch3"])
  })
})

describe("--since duration filter", () => {
  it("filters channels by last_post_at", () => {
    const now = Date.now()
    const channels = [
      makeChannel({ id: "ch1", last_post_at: now - 1000 }),         // 1s ago
      makeChannel({ id: "ch2", last_post_at: now - 48 * 3600_000 }), // 48h ago
      makeChannel({ id: "ch3", last_post_at: now - 12 * 3600_000 }), // 12h ago
    ]
    const ms = parseDuration("24h")
    const cutoff = now - ms
    const filtered = channels.filter((ch) => ch.last_post_at >= cutoff)
    expect(filtered).toHaveLength(2)
    expect(filtered.map((ch) => ch.id)).toEqual(["ch1", "ch3"])
  })
})

describe("unread count computation", () => {
  it("computes unread from total_msg_count_root - msg_count_root", () => {
    const channel = makeChannel({ total_msg_count_root: 100 })
    const member = makeMember({ msg_count_root: 85 })
    const unread = channel.total_msg_count_root - member.msg_count_root
    expect(unread).toBe(15)
  })

  it("clamps negative unread to zero", () => {
    const channel = makeChannel({ total_msg_count_root: 50 })
    const member = makeMember({ msg_count_root: 60 })
    const unread = Math.max(0, channel.total_msg_count_root - member.msg_count_root)
    expect(unread).toBe(0)
  })
})
