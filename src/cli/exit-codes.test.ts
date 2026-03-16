import { describe, it, expect } from "bun:test"
import { exitCodeForError, ExitCode } from "./exit-codes.ts"
import { MattermostApiError, ReadOnlyError } from "../api/errors.ts"

describe("exitCodeForError", () => {
  it("returns PERMISSION for ReadOnlyError", () => {
    expect(exitCodeForError(new ReadOnlyError("POST", "/api/v4/posts"))).toBe(ExitCode.PERMISSION)
  })

  it("returns AUTH for 401", () => {
    expect(exitCodeForError(new MattermostApiError("unauthorized", 401))).toBe(ExitCode.AUTH)
  })

  it("returns PERMISSION for 403", () => {
    expect(exitCodeForError(new MattermostApiError("forbidden", 403))).toBe(ExitCode.PERMISSION)
  })

  it("returns NOT_FOUND for 404", () => {
    expect(exitCodeForError(new MattermostApiError("not found", 404))).toBe(ExitCode.NOT_FOUND)
  })

  it("returns NETWORK for 5xx", () => {
    expect(exitCodeForError(new MattermostApiError("server error", 500))).toBe(ExitCode.NETWORK)
    expect(exitCodeForError(new MattermostApiError("gateway", 502))).toBe(ExitCode.NETWORK)
  })

  it("returns USAGE for 4xx client errors", () => {
    expect(exitCodeForError(new MattermostApiError("bad request", 400))).toBe(ExitCode.USAGE)
  })

  it("returns NETWORK for fetch TypeError", () => {
    expect(exitCodeForError(new TypeError("fetch failed"))).toBe(ExitCode.NETWORK)
  })

  it("returns USAGE for generic Error", () => {
    expect(exitCodeForError(new Error("something"))).toBe(ExitCode.USAGE)
  })

  it("returns USAGE for non-Error", () => {
    expect(exitCodeForError("string error")).toBe(ExitCode.USAGE)
  })
})
