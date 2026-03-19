import { describe, it, expect } from "bun:test"
import type { Post, User } from "../../api/types.ts"

function makePost(overrides: Partial<Post> = {}): Post {
  return {
    id: "p1",
    create_at: 1000,
    update_at: 1000,
    delete_at: 0,
    user_id: "u1",
    channel_id: "ch1",
    root_id: "",
    message: "hello world",
    type: "",
    props: {},
    hashtags: "",
    pending_post_id: "",
    ...overrides,
  } as Post
}

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: "u1",
    username: "alice",
    email: "alice@example.com",
    first_name: "Alice",
    last_name: "Smith",
    ...overrides,
  } as User
}

type Entry = { post: Post; author: User | null }

function applyFilters(
  entries: Entry[],
  opts: { grep?: string; from?: string },
): Entry[] {
  let result = entries
  if (opts.from) {
    const target = opts.from.toLowerCase()
    result = result.filter((e) => e.author?.username.toLowerCase() === target)
  }
  if (opts.grep) {
    const pattern = opts.grep.toLowerCase()
    result = result.filter((e) => e.post.message.toLowerCase().includes(pattern))
  }
  return result
}

describe("--grep filter", () => {
  it("filters posts by case-insensitive substring", () => {
    const entries: Entry[] = [
      { post: makePost({ id: "p1", message: "Hello World" }), author: makeUser() },
      { post: makePost({ id: "p2", message: "goodbye" }), author: makeUser() },
      { post: makePost({ id: "p3", message: "HELLO again" }), author: makeUser() },
    ]
    const result = applyFilters(entries, { grep: "hello" })
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.post.id)).toEqual(["p1", "p3"])
  })

  it("returns empty when no match", () => {
    const entries: Entry[] = [
      { post: makePost({ message: "nothing here" }), author: makeUser() },
    ]
    expect(applyFilters(entries, { grep: "xyz" })).toHaveLength(0)
  })
})

describe("--roots-only filter", () => {
  it("excludes posts with root_id", () => {
    const posts = [
      makePost({ id: "p1", root_id: "" }),
      makePost({ id: "p2", root_id: "p1" }),
      makePost({ id: "p3", root_id: "" }),
    ]
    const rootsOnly = posts.filter((p) => !p.root_id)
    expect(rootsOnly).toHaveLength(2)
    expect(rootsOnly.map((p) => p.id)).toEqual(["p1", "p3"])
  })
})

describe("--from filter", () => {
  it("filters by author username case-insensitively", () => {
    const entries: Entry[] = [
      { post: makePost({ id: "p1", user_id: "u1" }), author: makeUser({ id: "u1", username: "Alice" }) },
      { post: makePost({ id: "p2", user_id: "u2" }), author: makeUser({ id: "u2", username: "bob" }) },
      { post: makePost({ id: "p3", user_id: "u3" }), author: null },
    ]
    const result = applyFilters(entries, { from: "alice" })
    expect(result).toHaveLength(1)
    expect(result[0].post.id).toBe("p1")
  })

  it("excludes entries with null author", () => {
    const entries: Entry[] = [
      { post: makePost(), author: null },
    ]
    expect(applyFilters(entries, { from: "anyone" })).toHaveLength(0)
  })
})

describe("filter composition", () => {
  it("applies --from then --grep together", () => {
    const entries: Entry[] = [
      { post: makePost({ id: "p1", message: "deploy fix" }), author: makeUser({ username: "alice" }) },
      { post: makePost({ id: "p2", message: "deploy rollback" }), author: makeUser({ username: "bob" }) },
      { post: makePost({ id: "p3", message: "unrelated" }), author: makeUser({ username: "alice" }) },
    ]
    const result = applyFilters(entries, { from: "alice", grep: "deploy" })
    expect(result).toHaveLength(1)
    expect(result[0].post.id).toBe("p1")
  })
})
