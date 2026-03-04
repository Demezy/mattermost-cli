# mm — Mattermost CLI

A command-line tool for interacting with Mattermost servers via the REST API.
Built with Bun and TypeScript.

## Installation

### Nix (recommended)

Run directly without installing:

```bash
nix run github:demezy/mattermost-cli -- me
```

Or add to your flake inputs:

```nix
{
  inputs.mm.url = "github:demezy/mattermost-cli";
  # use the overlay: inputs.mm.overlays.default
}
```

### Bun

```bash
bunx github:demezy/mattermost-cli me
```

### From source

Requires [Bun](https://bun.sh) (v1.3.3+).

> **Nix users:** Bun in nixpkgs 25.11 produces 0-byte binaries when compiling.
> Use `nixpkgs-unstable` (Bun ≥ 1.3.3) instead. If using Home Manager, do
> **not** set `inputs.mm.inputs.nixpkgs.follows = "nixpkgs"` — the flake must
> use its own nixpkgs-unstable input to get a working Bun version.

```bash
git clone https://github.com/user/mattermost-cli.git
cd mattermost-cli
bun install
```

Run via `bun`:

```bash
bun bin/mm.ts <command>
```

Or build a standalone binary:

```bash
bun build --compile bin/mm.ts --outfile mm
./mm <command>
```

## Configuration

Set these environment variables (or put them in a `.env` file and load with
`bun --env-file=.env`):

| Variable       | Required | Description                                  |
| -------------- | -------- | -------------------------------------------- |
| `MM_URL`       | Yes      | Mattermost server base URL                   |
| `MM_TOKEN`     | Yes      | Personal access token                        |
| `MM_TEAM_ID`   | No       | Default team ID (required for some commands) |
| `MM_READ_ONLY` | No       | Set `true` to block all write operations     |

Copy `.env.template` to `.env` as a starting point:

```bash
cp .env.template .env
```

## Commands

```
mm channel    — Look up a channel by name or ID
mm channels   — List your channels (with optional name filter)
mm delete     — Delete your own post
mm dm         — Send a direct message
mm edit       — Edit your own post
mm mark-read  — Mark a channel or thread as read
mm me         — Show current user info
mm post       — Get a single post with its author
mm posts      — List recent posts in a channel
mm react      — Add a reaction to a post
mm reply      — Reply to a thread
mm search     — Search posts (supports Mattermost search syntax)
mm send       — Create a root post in a channel
mm thread     — Get a complete thread
mm unread     — Show channels with unread posts
mm user       — Get a user profile
```

Run `mm <command> --help` for detailed usage of any command.

### Reading

```bash
# Current user
mm me

# User profiles
mm user alice
mm user --id 8f3k...

# Channels
mm channels                       # list your channels
mm channels --name general        # filter by name
mm channel town-square            # look up a specific channel

# Posts
mm posts town-square              # recent posts (default: 50)
mm posts town-square --limit 10   # fewer posts
mm posts dev --since 2025-06-01   # posts since a date
mm post 8f3kx7...                 # single post by ID

# Threads
mm thread 8f3kx7...
mm thread https://mm.example.com/team/pl/8f3kx7...

# Search
mm search "deployment issue"
mm search --from alice --channel dev "error"

# Unread
mm unread                         # channels with unread posts
mm unread --show-muted            # include muted channels
```

### Writing

All write commands support `--dry-run` to preview without side effects.

```bash
# Post to a channel
mm send general "Hello, world!"

# Direct message
mm dm alice "Hey, got a minute?"

# Reply to a thread
mm reply 8f3kx7... "Thanks, that fixed it"

# Edit a post
mm edit 8f3kx7... "Updated message"

# React to a post
mm react 8f3kx7... thumbsup

# Delete a post (requires --confirm)
mm delete 8f3kx7... --confirm

# Mark as read
mm mark-read town-square          # mark channel as read
mm mark-read 8f3kx7... --thread   # mark thread as read
```

### Global flags

All commands accept:

- `--json` — machine-readable JSON output
- `--verbose` — show verbose/debug output

## Development

Requires [Bun](https://bun.sh) and optionally [just](https://just.systems) as
a task runner.

```bash
just install          # bun install
just test             # run tests
just lint             # type check
just run <args>       # run the CLI
just run-test <args>  # run CLI with .env.test (Docker test instance)
```

### Docker test environment

A Docker Compose setup is included for local integration testing:

```bash
just docker-setup     # start Mattermost, wait, seed data
just docker-down      # stop
just docker-open      # open http://localhost:8065 in browser
```

This creates a `.env.test` file pointing at the local instance.

## License

MIT
