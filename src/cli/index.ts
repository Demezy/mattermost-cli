import { defineCommand } from "citty"
import packageJson from "../../package.json"

export const mainCommand = defineCommand({
  meta: {
    name: "mm",
    version: packageJson.version,
    description: "CLI tool for interacting with Mattermost servers",
  },
  subCommands: {
    channel: () => import("./commands/channel.ts").then((m) => m.default),
    channels: () => import("./commands/channels.ts").then((m) => m.default),
    delete: () => import("./commands/delete.ts").then((m) => m.default),
    dm: () => import("./commands/dm.ts").then((m) => m.default),
    edit: () => import("./commands/edit.ts").then((m) => m.default),
    "mark-read": () => import("./commands/mark-read.ts").then((m) => m.default),
    me: () => import("./commands/me.ts").then((m) => m.default),
    post: () => import("./commands/post.ts").then((m) => m.default),
    posts: () => import("./commands/posts.ts").then((m) => m.default),
    react: () => import("./commands/react.ts").then((m) => m.default),
    reply: () => import("./commands/reply.ts").then((m) => m.default),
    search: () => import("./commands/search.ts").then((m) => m.default),
    send: () => import("./commands/send.ts").then((m) => m.default),
    thread: () => import("./commands/thread.ts").then((m) => m.default),
    unread: () => import("./commands/unread.ts").then((m) => m.default),
    user: () => import("./commands/user.ts").then((m) => m.default),
  },
})
