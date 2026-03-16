import { MattermostApiError, ReadOnlyError } from "../api/errors.ts"

export const ExitCode = {
  OK: 0,
  USAGE: 1,
  AUTH: 2,
  NOT_FOUND: 3,
  NETWORK: 4,
  PERMISSION: 5,
} as const

export type ExitCode = (typeof ExitCode)[keyof typeof ExitCode]

/** Map an error to a semantic exit code. */
export function exitCodeForError(err: unknown): ExitCode {
  if (err instanceof ReadOnlyError) return ExitCode.PERMISSION
  if (err instanceof MattermostApiError) {
    if (err.statusCode === 401) return ExitCode.AUTH
    if (err.statusCode === 403) return ExitCode.PERMISSION
    if (err.statusCode === 404) return ExitCode.NOT_FOUND
    if (err.statusCode >= 500) return ExitCode.NETWORK
    return ExitCode.USAGE
  }
  // Network-level errors (fetch failures)
  if (err instanceof TypeError && err.message.includes("fetch")) return ExitCode.NETWORK
  return ExitCode.USAGE
}
