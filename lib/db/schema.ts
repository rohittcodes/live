import { pgTable, text, timestamp, boolean, pgEnum, integer, index, json } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const userRoleEnum = pgEnum('user_role', ['user', 'admin']);

export const memberStatusEnum = pgEnum('member_status', ['pending', 'accepted', 'rejected']);

export const reactionTypeEnum = pgEnum('reaction_type', ['heart', 'fire', 'clap', 'wow', 'laugh']);

// Matches Cloudflare Stream's processing states
export const videoStatusEnum = pgEnum('video_status', ['queued', 'inprogress', 'ready', 'error']);

export const roomStatusEnum = pgEnum('room_status', ['scheduled', 'active', 'ended']);

// Recording status mirrors LiveKit Egress lifecycle
export const recordingStatusEnum = pgEnum('recording_status', ['starting', 'active', 'ending', 'complete', 'failed']);

export const users = pgTable('users', {
  id: text('id').primaryKey(), // Clerk user ID
  name: text('name').notNull(),
  username: text('username').unique(), // synced from Clerk, nullable until set
  email: text('email').notNull().unique(),
  imageUrl: text('image_url'),
  role: userRoleEnum('role').default('user').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const streams = pgTable('streams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  hostId: text('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'),
  category: text('category'),
  tags: json('tags').$type<string[]>().default([]),
  language: text('language').default('en'),
  isMembersOnly: boolean('is_members_only').default(false).notNull(),
  scheduledAt: timestamp('scheduled_at'),
  isLive: boolean('is_live').default(false).notNull(),
  // LiveKit ingress fields — created when you provision an ingress
  ingressId: text('ingress_id').unique(),
  rtmpUrl: text('rtmp_url'),               // RTMP server URL returned by LiveKit ingress
  streamKey: text('stream_key').notNull().unique(), // RTMP stream key from LiveKit
  livekitRoomName: text('livekit_room_name').unique(), // room viewers connect to
  // Egress / recording fields
  egressId: text('egress_id').unique(),
  recordingStatus: recordingStatusEnum('recording_status'),
  recordingUrl: text('recording_url'),     // public Cloudflare R2 URL once complete
  // Aggregates kept in sync for fast reads
  totalViews: integer('total_views').default(0).notNull(),
  peakConcurrentViewers: integer('peak_concurrent_viewers').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const streamMembers = pgTable('stream_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  streamId: text('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: memberStatusEnum('status').default('pending').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const comments = pgTable('comments', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  streamId: text('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const reactions = pgTable('reactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  streamId: text('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: reactionTypeEnum('type').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Audio-only LiveKit rooms. No ingress needed — participants join directly via SDK.
// Egress is optional: started when host decides to record, outputs to Cloudflare R2.
export const audioRooms = pgTable('audio_rooms', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  hostId: text('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  livekitRoomName: text('livekit_room_name').notNull().unique(),
  status: roomStatusEnum('status').default('scheduled').notNull(),
  scheduledAt: timestamp('scheduled_at'), // null = start immediately
  startedAt: timestamp('started_at'),
  endedAt: timestamp('ended_at'),
  // Egress fields — populated only when recording is requested
  egressId: text('egress_id').unique(),           // LiveKit egress job ID
  recordingStatus: recordingStatusEnum('recording_status'),
  // Cloudflare R2 URL of the finished recording (set by LiveKit egress webhook)
  recordingUrl: text('recording_url'),
  recordingDuration: integer('recording_duration'), // seconds
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('audio_rooms_host_id_idx').on(t.hostId),
]);

// Who participated and for how long — populated via LiveKit participant webhooks.
export const audioRoomParticipants = pgTable('audio_room_participants', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  roomId: text('room_id').notNull().references(() => audioRooms.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'), // null = still in room
}, (t) => [
  index('audio_room_participants_room_id_idx').on(t.roomId),
]);

// Pre-recorded videos uploaded to Cloudflare Stream.
// cloudflareVideoId is the UID returned by the Cloudflare API after upload.
// Playback: https://customer-<subdomain>.cloudflarestream.com/<cloudflareVideoId>/manifest/video.m3u8
// Thumbnail: https://customer-<subdomain>.cloudflarestream.com/<cloudflareVideoId>/thumbnails/thumbnail.jpg
export const videos = pgTable('videos', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  hostId: text('host_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  thumbnailUrl: text('thumbnail_url'), // custom thumbnail, overrides Cloudflare auto-thumb
  category: text('category'),
  tags: json('tags').$type<string[]>().default([]),
  language: text('language').default('en'),
  chapters: json('chapters').$type<{ time: number; title: string }[]>().default([]),
  // Cloudflare Stream UID — set immediately after upload is initiated
  cloudflareVideoId: text('cloudflare_video_id').unique(),
  // Filled in by Cloudflare webhook once processing is complete
  duration: integer('duration'), // seconds
  status: videoStatusEnum('status').default('queued').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  totalViews: integer('total_views').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('videos_host_id_idx').on(t.hostId),
]);

export const communityPostTypeEnum = pgEnum('community_post_type', ['post', 'announcement', 'update']);

export const communityPosts = pgTable('community_posts', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  authorId: text('author_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: communityPostTypeEnum('type').default('post').notNull(),
  title: text('title').notNull(),
  content: text('content').notNull(), // markdown
  tags: json('tags').$type<string[]>().default([]),
  imageUrls: json('image_urls').$type<string[]>().default([]),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  likesCount: integer('likes_count').default(0).notNull(),
  commentsCount: integer('comments_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('community_posts_author_id_idx').on(t.authorId),
  index('community_posts_published_idx').on(t.isPublished, t.publishedAt),
]);

// Per-session video watch tracking.
// watchedSeconds updated periodically — compute completion rate as watchedSeconds / video.duration.
export const videoViews = pgTable('video_views', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  videoId: text('video_id').notNull().references(() => videos.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null = anonymous
  watchedSeconds: integer('watched_seconds').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (t) => [
  index('video_views_video_id_idx').on(t.videoId),
]);

// Host can ban a user from a specific stream — blocks comments, reactions, join requests.
export const streamBans = pgTable('stream_bans', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  streamId: text('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (t) => [
  index('stream_bans_stream_id_idx').on(t.streamId),
  index('stream_bans_unique_idx').on(t.streamId, t.userId),
]);

// Tracks each viewer session: leftAt null = currently watching.
// Enables: live viewer count, unique viewers, watch duration, peak concurrent.
export const streamViews = pgTable('stream_views', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  streamId: text('stream_id').notNull().references(() => streams.id, { onDelete: 'cascade' }),
  userId: text('user_id').references(() => users.id, { onDelete: 'set null' }), // null = anonymous
  joinedAt: timestamp('joined_at').defaultNow().notNull(),
  leftAt: timestamp('left_at'), // null = still watching
}, (t) => [
  index('stream_views_stream_id_idx').on(t.streamId),
  index('stream_views_active_idx').on(t.streamId, t.leftAt),
]);

// --- Relations ---

export const usersRelations = relations(users, ({ many }) => ({
  streams: many(streams),
  videos: many(videos),
  audioRooms: many(audioRooms),
  comments: many(comments),
  reactions: many(reactions),
  streamMembers: many(streamMembers),
  streamBans: many(streamBans),
  audioRoomParticipants: many(audioRoomParticipants),
}));

export const streamsRelations = relations(streams, ({ one, many }) => ({
  host: one(users, { fields: [streams.hostId], references: [users.id] }),
  members: many(streamMembers),
  comments: many(comments),
  reactions: many(reactions),
  bans: many(streamBans),
  views: many(streamViews),
}));

export const streamMembersRelations = relations(streamMembers, ({ one }) => ({
  stream: one(streams, { fields: [streamMembers.streamId], references: [streams.id] }),
  user: one(users, { fields: [streamMembers.userId], references: [users.id] }),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  stream: one(streams, { fields: [comments.streamId], references: [streams.id] }),
  user: one(users, { fields: [comments.userId], references: [users.id] }),
}));

export const reactionsRelations = relations(reactions, ({ one }) => ({
  stream: one(streams, { fields: [reactions.streamId], references: [streams.id] }),
  user: one(users, { fields: [reactions.userId], references: [users.id] }),
}));

export const videosRelations = relations(videos, ({ one, many }) => ({
  host: one(users, { fields: [videos.hostId], references: [users.id] }),
  views: many(videoViews),
}));

export const videoViewsRelations = relations(videoViews, ({ one }) => ({
  video: one(videos, { fields: [videoViews.videoId], references: [videos.id] }),
  user: one(users, { fields: [videoViews.userId], references: [users.id] }),
}));

export const audioRoomsRelations = relations(audioRooms, ({ one, many }) => ({
  host: one(users, { fields: [audioRooms.hostId], references: [users.id] }),
  participants: many(audioRoomParticipants),
}));

export const audioRoomParticipantsRelations = relations(audioRoomParticipants, ({ one }) => ({
  room: one(audioRooms, { fields: [audioRoomParticipants.roomId], references: [audioRooms.id] }),
  user: one(users, { fields: [audioRoomParticipants.userId], references: [users.id] }),
}));

export const streamBansRelations = relations(streamBans, ({ one }) => ({
  stream: one(streams, { fields: [streamBans.streamId], references: [streams.id] }),
  user: one(users, { fields: [streamBans.userId], references: [users.id] }),
}));

export const streamViewsRelations = relations(streamViews, ({ one }) => ({
  stream: one(streams, { fields: [streamViews.streamId], references: [streams.id] }),
  user: one(users, { fields: [streamViews.userId], references: [users.id] }),
}));

export const communityPostsRelations = relations(communityPosts, ({ one }) => ({
  author: one(users, { fields: [communityPosts.authorId], references: [users.id] }),
}));

export const usersRelations2 = relations(users, ({ many }) => ({
  communityPosts: many(communityPosts),
}));

export type User = typeof users.$inferSelect;
export type Stream = typeof streams.$inferSelect;
export type StreamMember = typeof streamMembers.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Reaction = typeof reactions.$inferSelect;
export type StreamView = typeof streamViews.$inferSelect;
export type StreamBan = typeof streamBans.$inferSelect;
export type Video = typeof videos.$inferSelect;
export type VideoView = typeof videoViews.$inferSelect;
export type AudioRoom = typeof audioRooms.$inferSelect;
export type AudioRoomParticipant = typeof audioRoomParticipants.$inferSelect;
export type CommunityPost = typeof communityPosts.$inferSelect;
