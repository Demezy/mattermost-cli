import { describe, it, expect, beforeEach, afterEach, spyOn } from "bun:test"
import { output, outputError } from "./output.ts"

describe("output", () => {
  let logSpy: ReturnType<typeof spyOn>
  let logs: string[]

  beforeEach(() => {
    logs = []
    logSpy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "))
    })
  })
  afterEach(() => logSpy.mockRestore())

  it("prints text in non-json mode", () => {
    output({ id: "1" }, "hello text", { json: false })
    expect(logs[0]).toBe("hello text")
  })

  it("wraps data in envelope in json mode", () => {
    output({ id: "1" }, "hello text", { json: true })
    const parsed = JSON.parse(logs[0])
    expect(parsed.ok).toBe(true)
    expect(parsed.data.id).toBe("1")
  })

  it("filters fields in json mode", () => {
    output({ id: "1", name: "test", extra: "drop" }, "text", { json: true, fields: "id,name" })
    const parsed = JSON.parse(logs[0])
    expect(parsed.data).toEqual({ id: "1", name: "test" })
  })

  it("filters fields on array data", () => {
    output([{ id: "1", name: "a" }, { id: "2", name: "b" }], "text", { json: true, fields: "id" })
    const parsed = JSON.parse(logs[0])
    expect(parsed.data).toEqual([{ id: "1" }, { id: "2" }])
  })

  it("ignores fields in text mode", () => {
    output({ id: "1" }, "hello", { json: false, fields: "id" })
    expect(logs[0]).toBe("hello")
  })
})

describe("outputError", () => {
  it("writes JSON error to stdout in json mode", () => {
    const logs: string[] = []
    const spy = spyOn(console, "log").mockImplementation((...args: unknown[]) => {
      logs.push(args.map(String).join(" "))
    })
    outputError({ code: "not_found", message: "Not found", hint: "Check ID" }, true)
    spy.mockRestore()
    const parsed = JSON.parse(logs[0])
    expect(parsed.ok).toBe(false)
    expect(parsed.error.code).toBe("not_found")
    expect(parsed.error.hint).toBe("Check ID")
  })

  it("writes text error to stderr in non-json mode", () => {
    const errors: string[] = []
    const spy = spyOn(console, "error").mockImplementation((...args: unknown[]) => {
      errors.push(args.map(String).join(" "))
    })
    outputError({ code: "err", message: "Something failed", hint: "Try again" }, false)
    spy.mockRestore()
    expect(errors[0]).toContain("Something failed")
    expect(errors[1]).toContain("Try again")
  })
})
