import type { Channel, MattermostClient } from "../api/types.ts"

/** Mattermost IDs are 26 lowercase alphanumeric characters. */
const idPattern = /^[a-z0-9]{26}$/

/**
 * Resolve a channel by name or ID.
 * Treats 26-char alphanumeric strings as IDs; everything else as a channel name
 * requiring teamId for the lookup.
 */
export async function resolveChannel(
  client: MattermostClient,
  nameOrId: string,
  teamId?: string,
): Promise<Channel> {
  // Strip leading # (users naturally type #channel)
  const cleaned = nameOrId.replace(/^#/, "")
  if (idPattern.test(cleaned)) {
    return client.getChannel(cleaned)
  }
  if (!teamId) {
    throw new Error("MM_TEAM_ID is required to resolve channel names (or pass --team)")
  }
  return client.getChannelByNameForTeam(teamId, cleaned)
}
