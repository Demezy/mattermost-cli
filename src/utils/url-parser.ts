/** Parsed Mattermost URL. */
export interface ParsedUrl {
  teamName: string
  postId?: string
  channelName?: string
}

/**
 * Parse a Mattermost URL into its components.
 *
 * Supported formats:
 * - Permalink: https://mm.example.com/team-name/pl/<post-id>
 * - Channel:   https://mm.example.com/team-name/channels/<channel-name>
 */
export function parseMattermostUrl(input: string): ParsedUrl {
  let url: URL
  try {
    url = new URL(input)
  } catch {
    throw new Error(`Invalid Mattermost URL: ${input}`)
  }

  const segments = url.pathname.split("/").filter(Boolean)

  if (segments.length < 3) {
    throw new Error(`Cannot parse Mattermost URL (not enough path segments): ${input}`)
  }

  const teamName = segments[0]
  const kind = segments[1]
  const value = segments[2]

  if (kind === "pl") {
    return { teamName, postId: value }
  }

  if (kind === "channels") {
    return { teamName, channelName: value }
  }

  throw new Error(`Unknown Mattermost URL format (expected /pl/ or /channels/): ${input}`)
}
