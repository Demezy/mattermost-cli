import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatUser, userToData } from "../formatters.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "user",
    description: "Get a user profile",
  },
  args: {
    ...globalArgs,
    username: {
      type: "positional",
      description: "Username to look up",
    },
    id: {
      type: "string",
      description: "Look up by user ID instead of username",
    },
  },
  async run({ args }) {
    if (!args.username && !args.id) {
      console.error("Error: provide a username or use --id")
      process.exitCode = 1
      return
    }

    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })
    const username = args.username?.replace(/^@/, "")
    const user = args.id
      ? await client.getUser(args.id)
      : await client.getUserByUsername(username!)
    output(userToData(user), formatUser(user), { json: args.json, fields: args.fields })
  },
})
