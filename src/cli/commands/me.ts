import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { formatUser } from "../formatters.ts"

export default defineCommand({
  meta: {
    name: "me",
    description: "Show current user info",
  },
  args: {
    ...globalArgs,
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })
    const user = await client.getMe()
    console.log(formatUser(user, { json: args.json }))
  },
})
