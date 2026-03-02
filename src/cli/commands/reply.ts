import { defineCommand } from "citty"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import { globalArgs } from "../global-args.ts"
import { parseMattermostUrl } from "../../utils/url-parser.ts"

export default defineCommand({
  meta: {
    name: "reply",
    description: "Reply to a Mattermost thread",
  },
  args: {
    ...globalArgs,
    "thread-id": {
      type: "positional",
      description: "Thread root post ID or permalink URL",
      required: true,
    },
    message: {
      type: "positional",
      description: "Message to post",
      required: true,
    },
    "dry-run": {
      type: "boolean",
      description: "Preview the reply without posting",
      default: false,
    },
  },
  async run({ args }) {
    if (!args.message) {
      console.error("Error: message cannot be empty")
      process.exitCode = 1
      return
    }

    const threadRef = args["thread-id"]
    const message = args.message

    const config = loadConnectionConfig()
    const readOnly = process.env["MM_READ_ONLY"] === "true"
    const client = createClient({
      url: config.url,
      token: config.token,
      readOnly,
    })

    // Resolve thread root post ID
    let postId = threadRef
    if (threadRef.startsWith("http")) {
      const parsed = parseMattermostUrl(threadRef)
      if (!parsed.postId) {
        console.error("Error: URL does not contain a post ID (expected permalink format)")
        process.exitCode = 1
        return
      }
      postId = parsed.postId
    }

    // Resolve the actual thread root: if the post is a reply, use its root_id
    const post = await client.getPost(postId)
    const rootId = post.root_id || post.id
    const channelId = post.channel_id

    if (args["dry-run"]) {
      const preview = {
        action: "reply",
        channelId,
        rootId,
        message,
      }
      if (args.json) {
        console.log(JSON.stringify(preview))
      } else {
        console.log(`Would reply to thread ${rootId} in channel ${channelId}:`)
        console.log(message)
      }
      return
    }

    const created = await client.createPost({
      channel_id: channelId,
      root_id: rootId,
      message,
    })

    if (args.json) {
      console.log(JSON.stringify({ id: created.id, message: created.message }))
    } else {
      console.log(`Reply posted (${created.id})`)
    }
  },
})
