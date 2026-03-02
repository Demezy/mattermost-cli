import { describe, it, expect } from "bun:test"
import {
  formatUser,
  formatChannels,
  formatPost,
  formatPosts,
  formatThread,
} from "./formatters.ts"
import type { Channel, Post, User } from "../api/types.ts"

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    first_name: "Alice",
    last_name: "Smith",
    nickname: "",
    roles: "system_user",
    create_at: 0,
    update_at: 0,
    delete_at: 0,
    ...overrides,
  }
}

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "p1",
    create_at: 1705312320000, // 2024-01-15 12:32 UTC
    update_at: 1705312320000,
    delete_at: 0,
    edit_at: 0,
    user_id: "u1",
    channel_id: "ch1",
    root_id: "",
    original_id: "",
    message: "hello",
    type: "",
    props: {},
    hashtags: "",
    ...overrides,
  }
}

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
    total_msg_count: 0,
    last_post_at: 0,
    ...overrides,
  }
}

describe("formatUser", () => {
  it("formats user as text", () => {
    const output = formatUser(makeUser())
    expect(output).toContain("@alice")
    expect(output).toContain("Alice Smith")
    expect(output).toContain("alice@example.com")
  })

  it("formats user as JSON", () => {
    const output = formatUser(makeUser(), { json: true })
    const parsed = JSON.parse(output)
    expect(parsed.username).toBe("alice")
  })
})

describe("formatChannels", () => {
  it("formats channels as a table", () => {
    const output = formatChannels([makeChannel()])
    expect(output).toContain("ID\tType\tName")
    expect(output).toContain("ch1")
    expect(output).toContain("public")
    expect(output).toContain("Town Square")
  })

  it("formats channels as JSON", () => {
    const output = formatChannels([makeChannel()], { json: true })
    const parsed = JSON.parse(output)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe("ch1")
  })
})

describe("formatPost", () => {
  it("renders author and message", () => {
    const output = formatPost(makePost({ message: "Hello world" }), makeUser())
    expect(output).toContain("@alice")
    expect(output).toContain("Hello world")
  })

  it("renders null author as @<user_id>", () => {
    const output = formatPost(makePost({ user_id: "u999" }), null)
    expect(output).toContain("@<u999>")
  })

  it("indents when requested", () => {
    const output = formatPost(makePost(), makeUser(), { indent: true })
    expect(output).toMatch(/^ {2}@alice/m)
  })
})

describe("formatPosts", () => {
  it("formats posts as text with separators", () => {
    const entries = [
      { post: makePost({ message: "First" }), author: makeUser() },
      { post: makePost({ id: "p2", message: "Second" }), author: makeUser({ username: "bob" }) },
    ]
    const output = formatPosts(entries)
    expect(output).toContain("First")
    expect(output).toContain("Second")
    expect(output).toContain("---")
  })

  it("formats posts as JSON", () => {
    const entries = [{ post: makePost(), author: makeUser() }]
    const output = formatPosts(entries, { json: true })
    const parsed = JSON.parse(output)
    expect(parsed).toHaveLength(1)
    expect(parsed[0].id).toBe("p1")
    expect(parsed[0].author.username).toBe("alice")
  })

  it("renders null author in JSON", () => {
    const entries = [{ post: makePost(), author: null }]
    const output = formatPosts(entries, { json: true })
    const parsed = JSON.parse(output)
    expect(parsed[0].author).toBeNull()
  })
})

describe("formatThread", () => {
  it("indents replies", () => {
    const entries = [
      { post: makePost({ id: "root", message: "Root" }), author: makeUser() },
      {
        post: makePost({ id: "reply", root_id: "root", message: "Reply" }),
        author: makeUser({ username: "bob" }),
      },
    ]
    const output = formatThread(entries)
    expect(output).toContain("@alice")
    expect(output).toMatch(/^ {2}@bob/m)
    expect(output).toContain("---")
  })

  it("formats thread as JSON", () => {
    const entries = [
      { post: makePost({ id: "root" }), author: makeUser() },
      { post: makePost({ id: "reply", root_id: "root" }), author: makeUser({ username: "bob" }) },
    ]
    const output = formatThread(entries, { json: true })
    const parsed = JSON.parse(output)
    expect(parsed.rootId).toBe("root")
    expect(parsed.posts).toHaveLength(2)
  })
})
