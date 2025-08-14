const { pgTable, serial, text, timestamp, integer, boolean, jsonb } = require('drizzle-orm/pg-core');

// Users table for tracking WhatsApp users
const users = pgTable('users', {
  id: serial('id').primaryKey(),
  whatsappId: text('whatsapp_id').notNull().unique(),
  name: text('name'),
  isBlocked: boolean('is_blocked').default(false),
  lastSeen: timestamp('last_seen').defaultNow(),
  messageCount: integer('message_count').default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Messages table for logging conversations
const messages = pgTable('messages', {
  id: serial('id').primaryKey(),
  whatsappMessageId: text('whatsapp_message_id').unique(),
  userId: integer('user_id').references(() => users.id),
  chatId: text('chat_id').notNull(),
  messageType: text('message_type').notNull(), // text, image, video, audio, document, etc.
  content: text('content'),
  metadata: jsonb('metadata'), // Store additional message data
  isFromBot: boolean('is_from_bot').default(false),
  timestamp: timestamp('timestamp').defaultNow(),
  createdAt: timestamp('created_at').defaultNow()
});

// Commands table for tracking command usage
const commands = pgTable('commands', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  command: text('command').notNull(),
  parameters: text('parameters'),
  success: boolean('success').default(true),
  responseTime: integer('response_time'), // in milliseconds
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow()
});

// Bot settings table for configuration
const botSettings = pgTable('bot_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: text('value'),
  description: text('description'),
  updatedAt: timestamp('updated_at').defaultNow()
});

// Media downloads table for tracking media processing
const mediaDownloads = pgTable('media_downloads', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  platform: text('platform').notNull(), // youtube, tiktok, etc.
  originalUrl: text('original_url').notNull(),
  downloadType: text('download_type'), // video, audio
  fileSize: integer('file_size'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow()
});

// AI interactions table for Gemini AI usage tracking
const aiInteractions = pgTable('ai_interactions', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id),
  prompt: text('prompt').notNull(),
  response: text('response'),
  model: text('model').default('gemini-2.5-flash'),
  tokensUsed: integer('tokens_used'),
  responseTime: integer('response_time'),
  hasGrounding: boolean('has_grounding').default(false),
  groundingSources: jsonb('grounding_sources'),
  success: boolean('success').default(true),
  errorMessage: text('error_message'),
  timestamp: timestamp('timestamp').defaultNow()
});

module.exports = {
  users,
  messages,
  commands,
  botSettings,
  mediaDownloads,
  aiInteractions
};
