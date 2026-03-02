import { describe, it, expect } from "bun:test"
import { parseMattermostUrl } from "./url-parser.ts"

describe("parseMattermostUrl", () => {
  it("parses permalink URL", () => {
    const result = parseMattermostUrl("https://mm.example.com/team-name/pl/abc123def456")
    expect(result.teamName).toBe("team-name")
    expect(result.postId).toBe("abc123def456")
    expect(result.channelName).toBeUndefined()
  })

  it("parses channel URL", () => {
    const result = parseMattermostUrl("https://mm.example.com/my-team/channels/town-square")
    expect(result.teamName).toBe("my-team")
    expect(result.channelName).toBe("town-square")
    expect(result.postId).toBeUndefined()
  })

  it("throws on invalid URL", () => {
    expect(() => parseMattermostUrl("not-a-url")).toThrow("Invalid Mattermost URL")
  })

  it("throws on URL with too few segments", () => {
    expect(() => parseMattermostUrl("https://mm.example.com/team")).toThrow(
      "not enough path segments",
    )
  })

  it("throws on unknown URL format", () => {
    expect(() =>
      parseMattermostUrl("https://mm.example.com/team/unknown/abc"),
    ).toThrow("Unknown Mattermost URL format")
  })
})
