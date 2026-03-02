import type { ArgsDef } from "citty"

export const globalArgs = {
  json: {
    type: "boolean",
    description: "Output as JSON",
    default: false,
  },
  verbose: {
    type: "boolean",
    description: "Show verbose output",
    default: false,
  },
} as const satisfies ArgsDef
