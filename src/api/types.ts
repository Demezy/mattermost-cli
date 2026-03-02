/** Mattermost user object (subset of API response). */
export interface User {
  id: string
  username: string
  email: string
  first_name: string
  last_name: string
  nickname: string
  roles: string
  create_at: number
  update_at: number
  delete_at: number
}

/** Mattermost channel object. */
export interface Channel {
  id: string
  team_id: string
  type: "O" | "P" | "D" | "G"
  display_name: string
  name: string
  header: string
  purpose: string
  create_at: number
  update_at: number
  delete_at: number
  total_msg_count: number
  last_post_at: number
}

/** Mattermost post object. */
export interface Post {
  id: string
  create_at: number
  update_at: number
  delete_at: number
  edit_at: number
  user_id: string
  channel_id: string
  root_id: string
  original_id: string
  message: string
  type: string
  props: Record<string, unknown>
  hashtags: string
  metadata?: PostMetadata
}

/** Post metadata (file attachments, reactions, etc.). */
export interface PostMetadata {
  files?: FileInfo[]
  reactions?: Reaction[]
}

export interface FileInfo {
  id: string
  name: string
  size: number
  mime_type: string
  extension: string
}

export interface Reaction {
  user_id: string
  post_id: string
  emoji_name: string
  create_at: number
}

/** Mattermost channel member object. */
export interface ChannelMember {
  channel_id: string
  user_id: string
  msg_count: number
  mention_count: number
  last_viewed_at: number
  last_update_at: number
}

/**
 * Mattermost PostList response shape.
 * `order` is an array of post IDs in display order.
 * `posts` is a map of post ID → Post.
 */
export interface PostList {
  order: string[]
  posts: Record<string, Post>
  next_post_id: string
  prev_post_id: string
  has_next: boolean
}

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
  getMe(): Promise<User>
  getUser(userId: string): Promise<User>
  getUserByUsername(username: string): Promise<User>
  getChannel(channelId: string): Promise<Channel>
  getChannelByNameForTeam(teamId: string, name: string): Promise<Channel>
  getChannelsForTeamForUser(teamId: string): Promise<Channel[]>
  getPosts(channelId: string, opts?: GetPostsOptions): Promise<PostList>
  getPostThread(postId: string, opts?: GetPostThreadOptions): Promise<PostList>
  getPost(postId: string): Promise<Post>
  createPost(post: CreatePostRequest): Promise<Post>
  patchPost(postId: string, fields: { message: string }): Promise<Post>
  deletePost(postId: string): Promise<void>
  searchPosts(teamId: string, terms: string, isOrSearch?: boolean): Promise<PostList>
  getChannelMembersForUser(teamId: string): Promise<ChannelMember[]>
  createDirectChannel(userIds: [string, string]): Promise<Channel>
  addReaction(reaction: { user_id: string; post_id: string; emoji_name: string }): Promise<Reaction>
}
