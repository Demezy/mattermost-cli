export interface SuccessEnvelope<T = unknown> {
  ok: true
  data: T
}

export interface ErrorEnvelope {
  ok: false
  error: {
    code: string
    message: string
    hint?: string
    statusCode?: number
    mattermostErrorId?: string
  }
}

export type Envelope<T = unknown> = SuccessEnvelope<T> | ErrorEnvelope

/** Write a success response. JSON mode wraps in envelope; text mode prints as-is. */
export function output(data: unknown, text: string, opts: { json: boolean; fields?: string }): void {
  if (opts.json) {
    const filtered = opts.fields ? filterFields(data, opts.fields.split(",")) : data
    const envelope: SuccessEnvelope = { ok: true, data: filtered }
    console.log(JSON.stringify(envelope))
  } else {
    console.log(text)
  }
}

/** Write a structured error. JSON mode writes envelope to stdout; text mode writes to stderr. */
export function outputError(
  err: { code: string; message: string; hint?: string; statusCode?: number; mattermostErrorId?: string },
  json: boolean,
): void {
  if (json) {
    const envelope: ErrorEnvelope = { ok: false, error: err }
    console.log(JSON.stringify(envelope))
  } else {
    console.error(`Error: ${err.message}`)
    if (err.hint) console.error(`  Hint: ${err.hint}`)
  }
}

function filterFields(data: unknown, fields: string[]): unknown {
  if (Array.isArray(data)) {
    return data.map((item) => pickFields(item as Record<string, unknown>, fields))
  }
  if (data !== null && typeof data === "object") {
    return pickFields(data as Record<string, unknown>, fields)
  }
  return data
}

function pickFields(obj: Record<string, unknown>, fields: string[]): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const f of fields) {
    const key = f.trim()
    if (key in obj) result[key] = obj[key]
  }
  return result
}
