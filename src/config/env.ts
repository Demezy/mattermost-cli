import type { ConnectionConfig } from "./types.ts"

/** Load connection config from environment variables. Throws if required vars are missing. */
export function loadConnectionConfig(): ConnectionConfig {
  const url = process.env["MM_URL"]
  const token = process.env["MM_TOKEN"]
  const teamId = process.env["MM_TEAM_ID"]

  if (!url && !token) {
    throw new Error("Missing required environment variables: MM_URL, MM_TOKEN")
  }
  if (!url) {
    throw new Error("Missing required environment variable: MM_URL")
  }
  if (!token) {
    throw new Error("Missing required environment variable: MM_TOKEN")
  }

  return { url: url.replace(/\/+$/, ""), token, ...(teamId ? { teamId } : {}) }
}
