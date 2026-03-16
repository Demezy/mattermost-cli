import { defineCommand } from "citty"
import { buildManifest, manifestToMarkdown } from "../introspect.ts"

export default defineCommand({
  meta: {
    name: "schema",
    description: "Output JSON manifest of all commands (for agent integration)",
  },
  args: {
    markdown: {
      type: "boolean",
      description: "Output as Markdown instead of JSON",
      default: false,
    },
  },
  async run({ args }) {
    const manifest = await buildManifest()
    if (args.markdown) {
      console.log(manifestToMarkdown(manifest))
    } else {
      console.log(JSON.stringify(manifest, null, 2))
    }
  },
})
