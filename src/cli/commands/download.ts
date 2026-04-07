import { defineCommand } from "citty"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { loadConnectionConfig } from "../../config/index.ts"
import { createClient } from "../../api/client.ts"
import type { FileInfo } from "../../api/types.ts"
import { globalArgs } from "../global-args.ts"
import { output } from "../output.ts"

export default defineCommand({
  meta: {
    name: "download",
    description: "Download file attachments from a post",
  },
  args: {
    ...globalArgs,
    id: {
      type: "positional",
      description: "Post ID or file ID to download from",
      required: true,
    },
    output: {
      type: "string",
      alias: "o",
      description: `Output directory (default: ${tmpdir()})`,
    },
  },
  async run({ args }) {
    const config = loadConnectionConfig()
    const client = createClient({ url: config.url, token: config.token })
    const outDir = args.output ?? tmpdir()

    // Try as post ID first — if it has file metadata, download all attachments
    // Otherwise treat as a single file ID
    let files: FileInfo[]
    try {
      const post = await client.getPost(args.id)
      files = (post.metadata as { files?: FileInfo[] })?.files ?? []
      if (files.length === 0) {
        console.error("Error: post has no attachments")
        process.exitCode = 1
        return
      }
    } catch {
      // Not a post ID — treat as file ID, construct minimal FileInfo
      files = [{ id: args.id, name: args.id } as FileInfo]
    }

    const results: Array<{ id: string; name: string; path: string; size: number }> = []

    for (const f of files) {
      const buf = await client.getFileContent(f.id)
      const fileName = f.name ?? f.id
      const filePath = join(outDir, fileName)
      await Bun.write(filePath, buf)
      results.push({ id: f.id, name: fileName, path: filePath, size: buf.byteLength })
      console.error(`Downloaded: ${filePath} (${buf.byteLength} bytes)`)
    }

    const data = results.length === 1 ? results[0] : results
    const text = results.map((r) => r.path).join("\n")
    output(data, text, { json: args.json, fields: args.fields })
  },
})
