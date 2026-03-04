import { MattermostApiError, ReadOnlyError } from "./errors.ts"
import type {
  Channel,
  ChannelMember,
  ClientConfig,
  CreatePostRequest,
  MattermostClient,
  Post,
  PostList,
  Reaction,
  User,
} from "./types.ts"

export function createClient(config: ClientConfig): MattermostClient {
  const { url, token, readOnly } = config

  async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
    if (readOnly && method !== "GET") {
      throw new ReadOnlyError(method, path)
    }

    const res = await fetch(`${url}/api/v4${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
      throw new MattermostApiError(
        (body["message"] as string) ?? `HTTP ${res.status}`,
        res.status,
        body["id"] as string | undefined,
        `${method} ${path}`,
      )
    }

    return res.json() as Promise<T>
  }

  return {
    getMe: () => request<User>("GET", "/users/me"),

    getUser: (userId) => request<User>("GET", `/users/${userId}`),

    getUserByUsername: (username) => request<User>("GET", `/users/username/${username}`),

    getChannel: (channelId) => request<Channel>("GET", `/channels/${channelId}`),

    getChannelByNameForTeam: (teamId, name) =>
      request<Channel>("GET", `/teams/${teamId}/channels/name/${name}`),

    getChannelsForTeamForUser: (teamId) =>
      request<Channel[]>("GET", `/users/me/teams/${teamId}/channels`),

    getPosts: (channelId, opts = {}) => {
      const params = new URLSearchParams()
      if (opts.page !== undefined) params.set("page", String(opts.page))
      if (opts.perPage !== undefined) params.set("per_page", String(opts.perPage))
      if (opts.since !== undefined) params.set("since", String(opts.since))
      if (opts.before) params.set("before", opts.before)
      if (opts.after) params.set("after", opts.after)
      const qs = params.toString()
      return request<PostList>("GET", `/channels/${channelId}/posts${qs ? `?${qs}` : ""}`)
    },

    getPostThread: (postId, opts = {}) => {
      const params = new URLSearchParams()
      if (opts.perPage !== undefined) params.set("per_page", String(opts.perPage))
      if (opts.fromCreateAt !== undefined) params.set("fromCreateAt", String(opts.fromCreateAt))
      if (opts.fromPost) params.set("fromPost", opts.fromPost)
      const qs = params.toString()
      return request<PostList>("GET", `/posts/${postId}/thread${qs ? `?${qs}` : ""}`)
    },

    getPost: (postId) => request<Post>("GET", `/posts/${postId}`),

    createPost: (post: CreatePostRequest) => request<Post>("POST", "/posts", post),

    patchPost: (postId, fields) => request<Post>("PUT", `/posts/${postId}/patch`, fields),

    deletePost: async (postId) => {
      await request<unknown>("DELETE", `/posts/${postId}`)
    },

    searchPosts: (teamId, terms, isOrSearch = false) =>
      request<PostList>("POST", `/teams/${teamId}/posts/search`, {
        terms,
        is_or_search: isOrSearch,
      }),

    getChannelMembersForUser: (teamId) =>
      request<ChannelMember[]>("GET", `/users/me/teams/${teamId}/channels/members`),

    createDirectChannel: (userIds) => request<Channel>("POST", "/channels/direct", userIds),

    addReaction: (reaction) => request<Reaction>("POST", "/reactions", reaction),

    viewChannel: async (userId, channelId) => {
      await request<unknown>("POST", `/channels/members/${userId}/view`, { channel_id: channelId })
    },

    markThreadAsRead: async (userId, teamId, threadId, timestamp) => {
      await request<unknown>("PUT", `/users/${userId}/teams/${teamId}/threads/${threadId}/read/${timestamp}`)
    },
  }
}
