import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatChannels } from "../formatters.ts"

export default defineCommand({
  meta: {
    name: "channels",
    description: "List my channels",
  },
  args: {
    ...globalArgs,
    team: {
      type: "string",
      description: "Team ID (overrides MM_TEAM_ID)",
    },
    name: {
      type: "string",
      description: "Filter channels by name substring",
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const teamId = args.team ?? config.teamId
    if (!teamId) {
      console.error("Error: MM_TEAM_ID is required for this command (or pass --team)")
      process.exitCode = 1
      return
    }
    const client = createClient({ url: config.url, token: config.token })
    let channels = await client.getChannelsForTeamForUser(teamId)
    if (args.name) {
      const filter = args.name.toLowerCase()
      channels = channels.filter(
        (ch) =>
          ch.name.toLowerCase().includes(filter) ||
          ch.display_name.toLowerCase().includes(filter),
      )
    }
    console.log(formatChannels(channels, { json: args.json }))
  },
})
