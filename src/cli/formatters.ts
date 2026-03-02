import type { Channel, Post, User } from "../api/types.ts"

export function formatUser(user: User, opts?: { json?: boolean }): string {
  if (opts?.json) {
    return JSON.stringify(user)
  }
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")
  const parts = [`@${user.username}`]
  if (name) parts[0] += ` (${name})`
  parts[0] += ` — ${user.email}`
  return parts.join("\n")
}

export function formatChannel(channel: Channel, opts?: { json?: boolean }): string {
  if (opts?.json) {
    return JSON.stringify(channel)
  }
  const typeLabel: Record<string, string> = { O: "public", P: "private", D: "DM", G: "GM" }
  return `${channel.id}\t${typeLabel[channel.type] ?? channel.type}\t${channel.display_name || channel.name}`
}

export function formatChannels(channels: Channel[], opts?: { json?: boolean }): string {
  if (opts?.json) {
    return JSON.stringify(channels)
  }
  const header = "ID\tType\tName"
  const rows = channels.map((ch) => formatChannel(ch))
  return [header, ...rows].join("\n")
}

function authorName(author: User | null, userId: string): string {
  return author ? `@${author.username}` : `@<${userId}>`
}

function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  const date = d.toISOString().slice(0, 10)
  const time = d.toISOString().slice(11, 16)
  return `${date} ${time}`
}

export function formatPost(
  post: Post,
  author: User | null,
  opts?: { indent?: boolean },
): string {
  const prefix = opts?.indent ? "  " : ""
  const lines: string[] = []
  lines.push(`${prefix}${authorName(author, post.user_id)} (${formatDate(post.create_at)})`)
  for (const line of post.message.split("\n")) {
    lines.push(`${prefix}${line}`)
  }
  return lines.join("\n")
}

function postToJson(post: Post, author: User | null) {
  return {
    id: post.id,
    author: author ? { id: author.id, username: author.username } : null,
    message: post.message,
    createdAt: new Date(post.create_at).toISOString(),
    rootId: post.root_id || undefined,
  }
}

export function formatPosts(
  entries: Array<{ post: Post; author: User | null }>,
  opts?: { json?: boolean },
): string {
  if (opts?.json) {
    return JSON.stringify(entries.map((e) => postToJson(e.post, e.author)))
  }
  const lines: string[] = []
  for (const { post, author } of entries) {
    lines.push(formatPost(post, author))
    lines.push("")
    lines.push("---")
    lines.push("")
  }
  return lines.join("\n")
}

export function formatThread(
  entries: Array<{ post: Post; author: User | null }>,
  opts?: { json?: boolean },
): string {
  if (opts?.json) {
    const rootId = entries.length > 0 ? (entries[0].post.root_id || entries[0].post.id) : ""
    return JSON.stringify({
      rootId,
      posts: entries.map((e) => postToJson(e.post, e.author)),
    })
  }
  const lines: string[] = []
  for (const { post, author } of entries) {
    const isReply = !!post.root_id
    lines.push(formatPost(post, author, { indent: isReply }))
    lines.push("")
  }
  lines.push("---")
  return lines.join("\n")
}
