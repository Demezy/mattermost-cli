import { describe, it, expect } from "bun:test"
import {
  formatUser,
  formatChannels,
  formatPost,
  formatPosts,
  formatThread,
  userToData,
  channelsToData,
  postsToData,
  postToData,
  threadToData,
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
    const result = formatUser(makeUser())
    expect(result).toContain("@alice")
    expect(result).toContain("Alice Smith")
    expect(result).toContain("alice@example.com")
  })
})

describe("userToData", () => {
  it("returns the user object", () => {
    const user = makeUser()
    expect(userToData(user)).toBe(user)
  })
})

describe("formatChannels", () => {
  it("formats channels as a table", () => {
    const result = formatChannels([makeChannel()])
    expect(result).toContain("ID\tType\tName")
    expect(result).toContain("ch1")
    expect(result).toContain("public")
    expect(result).toContain("Town Square")
  })
})

describe("channelsToData", () => {
  it("returns the channels array", () => {
    const channels = [makeChannel()]
    const data = channelsToData(channels)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("ch1")
  })
})

describe("formatPost", () => {
  it("renders author and message", () => {
    const result = formatPost(makePost({ message: "Hello world" }), makeUser())
    expect(result).toContain("@alice")
    expect(result).toContain("Hello world")
  })

  it("renders null author as @<user_id>", () => {
    const result = formatPost(makePost({ user_id: "u999" }), null)
    expect(result).toContain("@<u999>")
  })

  it("indents when requested", () => {
    const result = formatPost(makePost(), makeUser(), { indent: true })
    expect(result).toMatch(/^ {2}@alice/m)
  })
})

describe("postToData", () => {
  it("shapes post data with author", () => {
    const data = postToData(makePost(), makeUser())
    expect(data.id).toBe("p1")
    expect(data.author?.username).toBe("alice")
    expect(data.message).toBe("hello")
    expect(data.createdAt).toContain("2024-01-15")
  })

  it("handles null author", () => {
    const data = postToData(makePost(), null)
    expect(data.author).toBeNull()
  })
})

describe("postsToData", () => {
  it("shapes array of posts", () => {
    const entries = [{ post: makePost(), author: makeUser() }]
    const data = postsToData(entries)
    expect(data).toHaveLength(1)
    expect(data[0].id).toBe("p1")
    expect(data[0].author?.username).toBe("alice")
  })

  it("handles null author in array", () => {
    const entries = [{ post: makePost(), author: null }]
    const data = postsToData(entries)
    expect(data[0].author).toBeNull()
  })
})

describe("formatPosts", () => {
  it("formats posts as text with separators", () => {
    const entries = [
      { post: makePost({ message: "First" }), author: makeUser() },
      { post: makePost({ id: "p2", message: "Second" }), author: makeUser({ username: "bob" }) },
    ]
    const result = formatPosts(entries)
    expect(result).toContain("First")
    expect(result).toContain("Second")
    expect(result).toContain("---")
  })
})

describe("threadToData", () => {
  it("shapes thread data with rootId", () => {
    const entries = [
      { post: makePost({ id: "root" }), author: makeUser() },
      { post: makePost({ id: "reply", root_id: "root" }), author: makeUser({ username: "bob" }) },
    ]
    const data = threadToData(entries)
    expect(data.rootId).toBe("root")
    expect(data.posts).toHaveLength(2)
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
    const result = formatThread(entries)
    expect(result).toContain("@alice")
    expect(result).toMatch(/^ {2}@bob/m)
    expect(result).toContain("---")
  })
})
