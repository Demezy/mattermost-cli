// Re-export Mattermost API types from the official package.
// We alias to shorter names used throughout this codebase.
export type { UserProfile as User } from "@mattermost/types/users"
export type { ServerChannel as Channel, ChannelMembership as ChannelMember } from "@mattermost/types/channels"
export type { Post, PostMetadata } from "@mattermost/types/posts"
export type { Reaction } from "@mattermost/types/reactions"
export type { FileInfo } from "@mattermost/types/files"

// PostList: upstream splits this into PostList + PaginatedPostList.
// Our API client returns PaginatedPostList (has `has_next`).
export type { PaginatedPostList as PostList } from "@mattermost/types/posts"

// Re-import aliases for use in MattermostClient below.
import type { UserProfile } from "@mattermost/types/users"
import type { ServerChannel } from "@mattermost/types/channels"
import type { ChannelMembership } from "@mattermost/types/channels"
import type { Post, PaginatedPostList } from "@mattermost/types/posts"
import type { Reaction } from "@mattermost/types/reactions"

/** Options for getPostThread endpoint. */
export interface GetPostThreadOptions {
  perPage?: number
  fromCreateAt?: number
  fromPost?: string
}

/** Options for getPosts endpoint. */
export interface GetPostsOptions {
  page?: number
  perPage?: number
  since?: number
  before?: string
  after?: string
}

/** Request body for creating a post. */
export interface CreatePostRequest {
  channel_id: string
  message: string
  root_id?: string
  props?: Record<string, unknown>
}

/** Client config passed to createClient. */
export interface ClientConfig {
  url: string
  token: string
  readOnly?: boolean
}

/** The Mattermost API client interface. */
export interface MattermostClient {
  getMe(): Promise<UserProfile>
  getUser(userId: string): Promise<UserProfile>
  getUserByUsername(username: string): Promise<UserProfile>
  getChannel(channelId: string): Promise<ServerChannel>
  getChannelByNameForTeam(teamId: string, name: string): Promise<ServerChannel>
  getChannelsForTeamForUser(teamId: string): Promise<ServerChannel[]>
  getPosts(channelId: string, opts?: GetPostsOptions): Promise<PaginatedPostList>
  getPostThread(postId: string, opts?: GetPostThreadOptions): Promise<PaginatedPostList>
  getPost(postId: string): Promise<Post>
  createPost(post: CreatePostRequest): Promise<Post>
  patchPost(postId: string, fields: { message: string }): Promise<Post>
  deletePost(postId: string): Promise<void>
  searchPosts(teamId: string, terms: string, isOrSearch?: boolean): Promise<PaginatedPostList>
  getChannelMembersForUser(teamId: string): Promise<ChannelMembership[]>
  createDirectChannel(userIds: [string, string]): Promise<ServerChannel>
  addReaction(reaction: { user_id: string; post_id: string; emoji_name: string }): Promise<Reaction>
  viewChannel(userId: string, channelId: string): Promise<void>
  markThreadAsRead(userId: string, teamId: string, threadId: string, timestamp: number): Promise<void>
  getFileContent(fileId: string): Promise<ArrayBuffer>
}
