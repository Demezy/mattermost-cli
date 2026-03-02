export class MattermostApiError extends Error {
  name = "MattermostApiError" as const

  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly mattermostErrorId?: string,
    public readonly url?: string,
  ) {
    super(message)
  }
}

export class ReadOnlyError extends Error {
  name = "ReadOnlyError" as const

  constructor(method: string, path: string) {
    super(`Write operation blocked (MM_READ_ONLY=true): ${method} ${path}`)
  }
}
