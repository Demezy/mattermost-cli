# mattermost-cli task runner

# List available recipes
default:
    @just --list

# Install dependencies
install:
    bun install

# Run all tests
test *args:
    bun test {{args}}

# Type check
lint:
    bun --bun tsc --noEmit

# Run the CLI
run *args:
    bun bin/mm.ts {{args}}

# Run CLI with test env
run-test *args:
    bun --env-file=.env.test bin/mm.ts {{args}}

# --- Docker ---

# Start test Mattermost
docker-up:
    docker compose -f docker/docker-compose.yml up -d
    @echo "Waiting for Mattermost to start..."
    @echo "Health check: docker logs -f mm-cli-test"

# Stop test Mattermost
docker-down:
    docker compose -f docker/docker-compose.yml down

# Initialize test instance (creates users, team, channels, seed data)
docker-init:
    ./docker/init.sh

# Full cycle: start, wait, init
docker-setup: docker-down docker-up
    @echo "Waiting 30s for Mattermost to initialize..."
    @sleep 30
    just docker-init

# Open test instance in browser
docker-open:
    open http://localhost:8065
