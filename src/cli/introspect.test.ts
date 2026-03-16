import { describe, it, expect } from "bun:test"
import { buildManifest, manifestToMarkdown } from "./introspect.ts"
import { commandAnnotations } from "./command-meta.ts"

describe("buildManifest", () => {
  it("returns all commands", async () => {
    const manifest = await buildManifest()
    expect(manifest.commands.length).toBeGreaterThanOrEqual(17)
    const names = manifest.commands.map((c) => c.name)
    expect(names).toContain("send")
    expect(names).toContain("me")
    expect(names).toContain("schema")
    expect(names).toContain("delete")
  })

  it("includes name and version from package.json", async () => {
    const manifest = await buildManifest()
    expect(manifest.name).toBe("mm")
    expect(manifest.version).toMatch(/^\d+\.\d+\.\d+/)
  })

  it("extracts args from commands", async () => {
    const manifest = await buildManifest()
    const send = manifest.commands.find((c) => c.name === "send")!
    expect(send.args.length).toBeGreaterThan(0)
    const channelArg = send.args.find((a) => a.name === "channel")!
    expect(channelArg.type).toBe("positional")
    expect(channelArg.required).toBe(true)
  })

  it("excludes global args from command args", async () => {
    const manifest = await buildManifest()
    for (const cmd of manifest.commands) {
      const argNames = cmd.args.map((a) => a.name)
      expect(argNames).not.toContain("json")
      expect(argNames).not.toContain("verbose")
      expect(argNames).not.toContain("fields")
    }
  })

  it("includes global args separately", async () => {
    const manifest = await buildManifest()
    const globalNames = manifest.globalArgs.map((a) => a.name)
    expect(globalNames).toContain("json")
    expect(globalNames).toContain("verbose")
    expect(globalNames).toContain("fields")
  })

  it("attaches annotations from commandAnnotations", async () => {
    const manifest = await buildManifest()
    const me = manifest.commands.find((c) => c.name === "me")!
    expect(me.annotations.readOnly).toBe(true)
    expect(me.annotations.idempotent).toBe(true)

    const send = manifest.commands.find((c) => c.name === "send")!
    expect(send.annotations.readOnly).toBe(false)
    expect(send.annotations.idempotent).toBe(false)

    const del = manifest.commands.find((c) => c.name === "delete")!
    expect(del.annotations.destructive).toBe(true)
  })

  it("has annotations for every command", async () => {
    const manifest = await buildManifest()
    for (const cmd of manifest.commands) {
      expect(commandAnnotations).toHaveProperty(cmd.name)
    }
  })

  it("includes env vars", async () => {
    const manifest = await buildManifest()
    const envNames = manifest.envVars.map((v) => v.name)
    expect(envNames).toContain("MM_URL")
    expect(envNames).toContain("MM_TOKEN")
    expect(envNames).toContain("MM_TEAM_ID")
    expect(envNames).toContain("MM_READ_ONLY")
  })
})

describe("manifestToMarkdown", () => {
  it("produces markdown with all commands", async () => {
    const manifest = await buildManifest()
    const md = manifestToMarkdown(manifest)
    expect(md).toContain("# mm v")
    expect(md).toContain("## Commands")
    expect(md).toContain("### mm send")
    expect(md).toContain("### mm me")
    expect(md).toContain("### mm schema")
    expect(md).toContain("## Environment Variables")
    expect(md).toContain("## Global Flags")
  })

  it("includes annotations in markdown", async () => {
    const manifest = await buildManifest()
    const md = manifestToMarkdown(manifest)
    expect(md).toContain("Read-only")
    expect(md).toContain("Destructive")
    expect(md).toContain("Idempotent")
  })
})
