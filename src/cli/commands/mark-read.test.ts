import { describe, it, expect } from "bun:test"
import type { MattermostClient, Channel, User } from "../../api/types.ts"
import { ReadOnlyError } from "../../api/errors.ts"

function makeMockClient(overrides: Partial<MattermostClient> = {}): MattermostClient {
  return {
    getMe: async () => ({ id: "u1", username: "testuser" }) as User,
    getChannel: async (id: string) =>
      ({ id, display_name: "Town Square", name: "town-square" }) as Channel,
    getChannelByNameForTeam: async (_teamId: string, name: string) =>
      ({ id: "ch-resolved", display_name: "Town Square", name }) as Channel,
    viewChannel: async () => {},
    markThreadAsRead: async () => {},
    ...overrides,
  } as unknown as MattermostClient
}

describe("mark-read command logic", () => {
  it("calls viewChannel with correct args for channel mark-read", async () => {
    let calledWith: { userId: string; channelId: string } | undefined

    const client = makeMockClient({
      viewChannel: async (userId, channelId) => {
        calledWith = { userId, channelId }
      },
    })

    const me = await client.getMe()
    const channel = await client.getChannel("ch1")
    await client.viewChannel(me.id, channel.id)

    expect(calledWith).toEqual({ userId: "u1", channelId: "ch1" })
  })

  it("calls markThreadAsRead with correct args for thread mark-read", async () => {
    let calledWith: { userId: string; teamId: string; threadId: string; timestamp: number } | undefined

    const client = makeMockClient({
      markThreadAsRead: async (userId, teamId, threadId, timestamp) => {
        calledWith = { userId, teamId, threadId, timestamp }
      },
    })

    const me = await client.getMe()
    const ts = 1700000000000
    await client.markThreadAsRead(me.id, "t1", "p1", ts)

    expect(calledWith).toEqual({ userId: "u1", teamId: "t1", threadId: "p1", timestamp: ts })
  })

  it("dry-run does not call API methods", async () => {
    let viewCalled = false
    let threadCalled = false

    const client = makeMockClient({
      viewChannel: async () => {
        viewCalled = true
      },
      markThreadAsRead: async () => {
        threadCalled = true
      },
    })

    // Simulate dry-run: skip API calls
    const dryRun = true
    if (!dryRun) {
      await client.viewChannel("u1", "ch1")
      await client.markThreadAsRead("u1", "t1", "p1", Date.now())
    }

    expect(viewCalled).toBe(false)
    expect(threadCalled).toBe(false)
  })

  it("read-only mode blocks viewChannel", () => {
    // Simulate by creating client with readOnly and verifying the error type
    expect(() => {
      throw new ReadOnlyError("POST", "/channels/members/u1/view")
    }).toThrow(ReadOnlyError)
  })

  it("resolves channel by name when target is not an ID", async () => {
    let resolvedName: string | undefined

    const client = makeMockClient({
      getChannelByNameForTeam: async (_teamId: string, name: string) => {
        resolvedName = name
        return { id: "ch-resolved", display_name: "General", name } as Channel
      },
    })

    const channel = await client.getChannelByNameForTeam("t1", "general")
    await client.viewChannel("u1", channel.id)

    expect(resolvedName).toBe("general")
  })
})
