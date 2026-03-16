export interface AgentAnnotations {
  readonly readOnly: boolean
  readonly destructive: boolean
  readonly idempotent: boolean
}

/** Agentic annotations for each command. Used by `mm schema` to describe command behavior. */
export const commandAnnotations: Record<string, AgentAnnotations> = {
  // Read commands
  me:        { readOnly: true,  destructive: false, idempotent: true },
  user:      { readOnly: true,  destructive: false, idempotent: true },
  channel:   { readOnly: true,  destructive: false, idempotent: true },
  channels:  { readOnly: true,  destructive: false, idempotent: true },
  post:      { readOnly: true,  destructive: false, idempotent: true },
  posts:     { readOnly: true,  destructive: false, idempotent: true },
  thread:    { readOnly: true,  destructive: false, idempotent: true },
  search:    { readOnly: true,  destructive: false, idempotent: true },
  unread:    { readOnly: true,  destructive: false, idempotent: true },
  schema:    { readOnly: true,  destructive: false, idempotent: true },
  // Write commands
  send:      { readOnly: false, destructive: false, idempotent: false },
  dm:        { readOnly: false, destructive: false, idempotent: false },
  reply:     { readOnly: false, destructive: false, idempotent: false },
  react:     { readOnly: false, destructive: false, idempotent: true },
  edit:      { readOnly: false, destructive: false, idempotent: false },
  delete:    { readOnly: false, destructive: true,  idempotent: true },
  "mark-read": { readOnly: false, destructive: false, idempotent: true },
}
