import type { MattermostClient, User } from "../api/types.ts"

export async function resolveUsers(
  client: MattermostClient,
  userIds: string[],
): Promise<Map<string, User | null>> {
  const results = new Map<string, User | null>()
  await Promise.all(
    userIds.map(async (id) => {
      try {
        results.set(id, await client.getUser(id))
      } catch {
        results.set(id, null)
      }
    }),
  )
  return results
}
