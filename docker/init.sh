#!/bin/bash
set -e

CONTAINER="mm-cli-test"
ADMIN_USER="admin"
ADMIN_PASS="Admin123!"
ADMIN_EMAIL="admin@test.local"
TEAM="test-team"
TEAM_DISPLAY="Test Team"

mmctl() {
    docker exec "$CONTAINER" mmctl --local "$@"
}

# --- Wait for healthy ---

echo "Waiting for Mattermost..."
until mmctl system status > /dev/null 2>&1; do
    sleep 3
done
echo "Mattermost is ready."

# --- Users ---

echo "Creating users..."
mmctl user create \
    --email "$ADMIN_EMAIL" --username "$ADMIN_USER" \
    --password "$ADMIN_PASS" --system-admin 2>/dev/null \
    || echo "  $ADMIN_USER exists"

for u in alice bob charlie; do
    mmctl user create \
        --email "${u}@test.local" --username "$u" \
        --password "${u}${u}123" 2>/dev/null \
        || echo "  $u exists"
done

# --- Team ---

echo "Creating team..."
mmctl team create \
    --name "$TEAM" --display-name "$TEAM_DISPLAY" \
    --private 2>/dev/null \
    || echo "  $TEAM exists"

TEAM_ID=$(mmctl team list --json 2>/dev/null \
    | bun -e "
        const teams = JSON.parse(await Bun.stdin.text());
        const t = teams.find(t => t.name === '$TEAM');
        if (t) process.stdout.write(t.id);
    " 2>/dev/null)

if [ -z "$TEAM_ID" ] || ! echo "$TEAM_ID" | grep -qE '^[a-z0-9]{26}$'; then
    echo "ERROR: Could not extract team ID"
    exit 1
fi
echo "  Team ID: $TEAM_ID"

echo "Adding users to team..."
for u in "$ADMIN_USER" alice bob charlie; do
    mmctl team users add "$TEAM" "$u" 2>/dev/null || true
done

# --- Channels ---

echo "Creating channels..."
for ch in general dev random; do
    mmctl channel create \
        --team "$TEAM" --name "$ch" \
        --display-name "$(echo "$ch" | awk '{print toupper(substr($0,1,1)) substr($0,2)}')" 2>/dev/null \
        || echo "  $ch exists"
done

echo "Adding users to channels..."
for ch in general dev random; do
    for u in "$ADMIN_USER" alice bob charlie; do
        mmctl channel users add "$TEAM:$ch" "$u" 2>/dev/null || true
    done
done

# --- Token ---

echo "Generating access token..."
TOKEN_OUT=$(mmctl token generate "$ADMIN_USER" "cli-test-token" 2>/dev/null || true)
TOKEN=$(echo "$TOKEN_OUT" | sed -n 's/^\([a-z0-9]*\): .*/\1/p')

if [ -z "$TOKEN" ]; then
    echo "  Token generation failed — generate manually at http://localhost:8065"
    TOKEN="<GENERATE_MANUALLY>"
fi

# --- Seed data ---

echo "Seeding test data..."
API="http://localhost:8065/api/v4"
AUTH="Authorization: Bearer $TOKEN"

# Get channel IDs
GENERAL_ID=$(curl -s -H "$AUTH" "$API/teams/$TEAM_ID/channels/name/general" | bun -e "
    const ch = JSON.parse(await Bun.stdin.text());
    process.stdout.write(ch.id || '');
" 2>/dev/null)

DEV_ID=$(curl -s -H "$AUTH" "$API/teams/$TEAM_ID/channels/name/dev" | bun -e "
    const ch = JSON.parse(await Bun.stdin.text());
    process.stdout.write(ch.id || '');
" 2>/dev/null)

# Get user IDs
ALICE_ID=$(curl -s -H "$AUTH" "$API/users/username/alice" | bun -e "
    const u = JSON.parse(await Bun.stdin.text());
    process.stdout.write(u.id || '');
" 2>/dev/null)

BOB_ID=$(curl -s -H "$AUTH" "$API/users/username/bob" | bun -e "
    const u = JSON.parse(await Bun.stdin.text());
    process.stdout.write(u.id || '');
" 2>/dev/null)

# Get alice and bob tokens for posting as them
ALICE_TOKEN_OUT=$(mmctl token generate alice "alice-token" 2>/dev/null || true)
ALICE_TOKEN=$(echo "$ALICE_TOKEN_OUT" | sed -n 's/^\([a-z0-9]*\): .*/\1/p')

BOB_TOKEN_OUT=$(mmctl token generate bob "bob-token" 2>/dev/null || true)
BOB_TOKEN=$(echo "$BOB_TOKEN_OUT" | sed -n 's/^\([a-z0-9]*\): .*/\1/p')

post() {
    local token="$1" channel="$2" message="$3" root_id="${4:-}"
    local body="{\"channel_id\":\"$channel\",\"message\":\"$message\""
    if [ -n "$root_id" ]; then
        body="$body,\"root_id\":\"$root_id\""
    fi
    body="$body}"
    curl -s -H "Authorization: Bearer $token" -H "Content-Type: application/json" \
        -d "$body" "$API/posts"
}

if [ -n "$GENERAL_ID" ] && [ -n "$ALICE_TOKEN" ] && [ -n "$BOB_TOKEN" ]; then
    echo "  Posting in #general..."

    # A conversation
    P1=$(post "$ALICE_TOKEN" "$GENERAL_ID" "Hey team, the deploy finished successfully." \
        | bun -e "const p=JSON.parse(await Bun.stdin.text()); process.stdout.write(p.id||'')" 2>/dev/null)
    sleep 0.5

    post "$BOB_TOKEN" "$GENERAL_ID" "Nice! I'll run the smoke tests now." "$P1" > /dev/null
    sleep 0.5

    post "$ALICE_TOKEN" "$GENERAL_ID" "Sounds good, let me know if anything breaks." "$P1" > /dev/null
    sleep 0.5

    # A standalone post
    post "$TOKEN" "$GENERAL_ID" "Reminder: retro meeting at 3pm today." > /dev/null
    sleep 0.5

    echo "  Posting in #dev..."

    P2=$(post "$BOB_TOKEN" "$DEV_ID" "Found a bug in the auth middleware — tokens expire too early." \
        | bun -e "const p=JSON.parse(await Bun.stdin.text()); process.stdout.write(p.id||'')" 2>/dev/null)
    sleep 0.5

    post "$ALICE_TOKEN" "$DEV_ID" "Can you share the logs? I can take a look." "$P2" > /dev/null
    sleep 0.5

    post "$BOB_TOKEN" "$DEV_ID" "Posted in the incident channel. Token TTL was set to 5 min instead of 5 hours." "$P2" > /dev/null

    # --- Threads ---

    echo "  Creating threads in #general..."

    # Thread 1: short planning thread (alice starts, bob & admin reply)
    T1=$(post "$ALICE_TOKEN" "$GENERAL_ID" "We need to decide on the migration strategy for the database. Any preferences?" \
        | bun -e "const p=JSON.parse(await Bun.stdin.text()); process.stdout.write(p.id||'')" 2>/dev/null)
    sleep 0.3
    post "$BOB_TOKEN" "$GENERAL_ID" "I'd vote for a blue-green deployment so we can roll back easily." "$T1" > /dev/null
    sleep 0.3
    post "$TOKEN" "$GENERAL_ID" "Agreed. Let's also run the migration on staging first." "$T1" > /dev/null
    sleep 0.3
    post "$ALICE_TOKEN" "$GENERAL_ID" "Sounds good. I'll draft the runbook and share it tomorrow." "$T1" > /dev/null
    sleep 0.3
    post "$BOB_TOKEN" "$GENERAL_ID" "Can you include rollback steps too?" "$T1" > /dev/null
    sleep 0.3
    post "$ALICE_TOKEN" "$GENERAL_ID" "Of course, that's the most important part." "$T1" > /dev/null

    # Thread 2: short debugging thread in #dev (bob starts, alice helps)
    T2=$(post "$BOB_TOKEN" "$DEV_ID" "Getting a weird 502 on the /api/v4/users endpoint intermittently." \
        | bun -e "const p=JSON.parse(await Bun.stdin.text()); process.stdout.write(p.id||'')" 2>/dev/null)
    sleep 0.3
    post "$ALICE_TOKEN" "$DEV_ID" "Is it behind the load balancer? Could be a health check issue." "$T2" > /dev/null
    sleep 0.3
    post "$BOB_TOKEN" "$DEV_ID" "Good call — one of the backend pods is OOMing. Restarting now." "$T2" > /dev/null
    sleep 0.3
    post "$ALICE_TOKEN" "$DEV_ID" "We should bump the memory limit on that deployment." "$T2" > /dev/null
    sleep 0.3
    post "$BOB_TOKEN" "$DEV_ID" "Done. Bumped from 512Mi to 1Gi. Monitoring it now." "$T2" > /dev/null

    # Thread 3: long thread with 200+ messages in #general
    echo "  Creating long thread (200+ messages) in #general..."
    T3=$(post "$ALICE_TOKEN" "$GENERAL_ID" "Starting the load test run — posting progress updates here." \
        | bun -e "const p=JSON.parse(await Bun.stdin.text()); process.stdout.write(p.id||'')" 2>/dev/null)
    sleep 0.3

    for i in $(seq 1 210); do
        if (( i % 2 == 1 )); then
            post "$ALICE_TOKEN" "$GENERAL_ID" "Load test progress: iteration $i / 210" "$T3" > /dev/null
        else
            post "$BOB_TOKEN" "$GENERAL_ID" "Ack iteration $i — metrics look stable" "$T3" > /dev/null
        fi
        # Print progress every 50 messages
        if (( i % 50 == 0 )); then
            echo "    $i / 210 messages..."
        fi
    done
    echo "    210 / 210 messages — done."

    echo "  Seed data created."
else
    echo "  Skipping seed data (missing channel/user IDs or tokens)."
fi

# --- Output ---

echo ""
echo "========================================"
echo "  Mattermost Test Instance Ready"
echo "========================================"
echo ""
echo "  URL:       http://localhost:8065"
echo "  Admin:     $ADMIN_USER / $ADMIN_PASS"
echo "  Users:     alice / alicealice123"
echo "             bob / bobbob123"
echo "             charlie / charliecharlie123"
echo "  Team:      $TEAM (ID: $TEAM_ID)"
echo "  Channels:  general, dev, random"
echo "  Token:     $TOKEN"
echo ""

# Write .env.test
ENV_FILE="$(dirname "$0")/../.env.test"
cat > "$ENV_FILE" << EOF
# Generated by docker/init.sh — $(date -Iseconds)
MM_URL=http://localhost:8065
MM_TOKEN=$TOKEN
MM_TEAM_ID=$TEAM_ID
EOF

echo "Written to $ENV_FILE"
echo ""
echo "Usage:"
echo "  source .env.test && mm me"
echo "  source .env.test && mm channels"
echo "  source .env.test && mm posts <channel-id>"
