import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { loadConnectionConfig } from "./env.ts"

describe("loadConnectionConfig", () => {
  const origEnv = { ...process.env }

  beforeEach(() => {
    delete process.env["MM_URL"]
    delete process.env["MM_TOKEN"]
    delete process.env["MM_TEAM_ID"]
  })

  afterEach(() => {
    process.env["MM_URL"] = origEnv["MM_URL"]
    process.env["MM_TOKEN"] = origEnv["MM_TOKEN"]
    process.env["MM_TEAM_ID"] = origEnv["MM_TEAM_ID"]
  })

  it("loads config from env vars", () => {
    process.env["MM_URL"] = "https://mm.example.com"
    process.env["MM_TOKEN"] = "test-token"

    const config = loadConnectionConfig()
    expect(config.url).toBe("https://mm.example.com")
    expect(config.token).toBe("test-token")
  })

  it("strips trailing slashes from URL", () => {
    process.env["MM_URL"] = "https://mm.example.com///"
    process.env["MM_TOKEN"] = "test-token"

    const config = loadConnectionConfig()
    expect(config.url).toBe("https://mm.example.com")
  })

  it("throws when MM_URL is missing", () => {
    process.env["MM_TOKEN"] = "test-token"
    expect(() => loadConnectionConfig()).toThrow("MM_URL")
  })

  it("throws when MM_TOKEN is missing", () => {
    process.env["MM_URL"] = "https://mm.example.com"
    expect(() => loadConnectionConfig()).toThrow("MM_TOKEN")
  })

  it("throws with both var names when both are missing", () => {
    expect(() => loadConnectionConfig()).toThrow("MM_URL, MM_TOKEN")
  })

  it("loads optional MM_TEAM_ID when present", () => {
    process.env["MM_URL"] = "https://mm.example.com"
    process.env["MM_TOKEN"] = "test-token"
    process.env["MM_TEAM_ID"] = "team123"

    const config = loadConnectionConfig()
    expect(config.teamId).toBe("team123")
  })

  it("omits teamId when MM_TEAM_ID is not set", () => {
    process.env["MM_URL"] = "https://mm.example.com"
    process.env["MM_TOKEN"] = "test-token"

    const config = loadConnectionConfig()
    expect(config.teamId).toBeUndefined()
  })
})
