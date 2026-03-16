# mm v0.1.2

CLI tool for interacting with Mattermost servers

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MM_URL` | Yes | Mattermost server base URL |
| `MM_TOKEN` | Yes | Personal access token |
| `MM_TEAM_ID` | No | Team ID (required for channel-scoped commands) |
| `MM_READ_ONLY` | No | Set true to block write operations |

## Global Flags

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--json` | boolean | false | Output as JSON |
| `--verbose` | boolean | false | Show verbose output |
| `--fields` | string | - | Comma-separated fields to include in JSON output |

## Commands

### mm channel

Look up a channel

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<name>` | positional | no | - | Channel name |
| `--id` | string | no | - | Look up by channel ID instead of name |
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |

---

### mm channels

List my channels

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |
| `--name` | string | no | - | Filter channels by name substring |

---

### mm delete

Delete your own post

Write | Destructive | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<post-id>` | positional | yes | - | Post ID to delete |
| `--confirm` | boolean | no | false | Confirm deletion (required) |
| `--dry-run` | boolean | no | false | Preview without deleting |

---

### mm dm

Send a direct message

Write | Not idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<username>` | positional | yes | - | Username to message |
| `<message>` | positional | yes | - | Message to send |
| `--dry-run` | boolean | no | false | Preview without sending |

---

### mm edit

Edit your own post

Write | Not idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<post-id>` | positional | yes | - | Post ID to edit |
| `<message>` | positional | yes | - | New message content |
| `--dry-run` | boolean | no | false | Preview without editing |

---

### mm mark-read

Mark a channel or thread as read

Write | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<target>` | positional | yes | - | Channel name, ID, or thread root post ID |
| `--thread` | boolean | no | false | Treat target as a thread root post ID |
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |
| `--dry-run` | boolean | no | false | Preview without marking as read |

---

### mm me

Show current user info

Read-only | Idempotent

---

### mm post

Get a single post with its author

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<id>` | positional | yes | - | Post ID |

---

### mm posts

List recent posts in a channel

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<channel>` | positional | yes | - | Channel name or ID |
| `--limit` | string | no | - | Max posts to return (default: 50, max: 200) |
| `--since` | string | no | - | Fetch posts since this date (ISO 8601) |
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |

---

### mm react

Add a reaction to a post

Write | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<post-id>` | positional | yes | - | Post ID to react to |
| `<emoji>` | positional | yes | - | Emoji name (e.g. thumbsup, heart) |
| `--dry-run` | boolean | no | false | Preview without reacting |

---

### mm reply

Reply to a Mattermost thread

Write | Not idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<thread-id>` | positional | yes | - | Thread root post ID or permalink URL |
| `<message>` | positional | yes | - | Message to post |
| `--dry-run` | boolean | no | false | Preview the reply without posting |

---

### mm schema

Output JSON manifest of all commands (for agent integration)

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `--markdown` | boolean | no | false | Output as Markdown instead of JSON |

---

### mm search

Search posts

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<query>` | positional | yes | - | Search query (supports Mattermost search syntax: from:, in:, before:, after:) |
| `--channel` | string | no | - | Filter by channel name (adds in: prefix) |
| `--from` | string | no | - | Filter by username (adds from: prefix) |
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |

---

### mm send

Create a root post in a channel

Write | Not idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<channel>` | positional | yes | - | Channel name or ID |
| `<message>` | positional | yes | - | Message to post |
| `--dry-run` | boolean | no | false | Preview without posting |
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |

---

### mm thread

Get a complete thread

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<id-or-url>` | positional | yes | - | Thread root post ID or permalink URL |

---

### mm unread

Show channels with unread posts

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `--team` | string | no | - | Team ID (overrides MM_TEAM_ID) |
| `--show-muted` | boolean | no | false | Include muted channels (hidden by default) |

---

### mm user

Get a user profile

Read-only | Idempotent

| Argument | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `<username>` | positional | no | - | Username to look up |
| `--id` | string | no | - | Look up by user ID instead of username |

---

