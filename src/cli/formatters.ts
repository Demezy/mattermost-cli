import type { Channel, Post, User, FileInfo } from "../api/types.ts"

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileToData(f: FileInfo) {
  return {
    id: f.id,
    name: f.name,
    size: f.size,
    mimeType: f.mime_type,
    ...(f.width ? { width: f.width, height: f.height } : {}),
  }
}

function getFiles(post: Post): FileInfo[] {
  return (post.metadata as { files?: FileInfo[] })?.files ?? []
}

// --- Data-shaping functions (for JSON envelope) ---

export function userToData(user: User) {
  return user
}

export function channelToData(channel: Channel) {
  return channel
}

export function channelsToData(channels: Channel[]) {
  return channels
}

export function postToData(post: Post, author: User | null) {
  const files = getFiles(post)
  return {
    id: post.id,
    author: author ? { id: author.id, username: author.username } : null,
    message: post.message,
    createdAt: new Date(post.create_at).toISOString(),
    rootId: post.root_id || undefined,
    ...(files.length > 0 ? { attachments: files.map(fileToData) } : {}),
  }
}

export function postsToData(entries: Array<{ post: Post; author: User | null }>) {
  return entries.map((e) => postToData(e.post, e.author))
}

export function threadToData(entries: Array<{ post: Post; author: User | null }>) {
  const rootId = entries.length > 0 ? (entries[0].post.root_id || entries[0].post.id) : ""
  return {
    rootId,
    posts: entries.map((e) => postToData(e.post, e.author)),
  }
}

// --- Text formatting functions (for human-readable output) ---

export function formatUser(user: User): string {
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ")
  const parts = [`@${user.username}`]
  if (name) parts[0] += ` (${name})`
  parts[0] += ` — ${user.email}`
  return parts.join("\n")
}

export function formatChannel(channel: Channel): string {
  const typeLabel: Record<string, string> = { O: "public", P: "private", D: "DM", G: "GM" }
  return `${channel.id}\t${typeLabel[channel.type] ?? channel.type}\t${channel.display_name || channel.name}`
}

export function formatChannels(channels: Channel[]): string {
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
  for (const f of getFiles(post)) {
    const size = formatFileSize(f.size)
    const dims = f.width ? `, ${f.width}x${f.height}` : ""
    lines.push(`${prefix}[attachment: ${f.name} (${f.mime_type}, ${size}${dims}) id:${f.id}]`)
  }
  return lines.join("\n")
}

export function formatPosts(
  entries: Array<{ post: Post; author: User | null }>,
): string {
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
): string {
  const lines: string[] = []
  for (const { post, author } of entries) {
    const isReply = !!post.root_id
    lines.push(formatPost(post, author, { indent: isReply }))
    lines.push("")
  }
  lines.push("---")
  return lines.join("\n")
}
