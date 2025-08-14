-- Initial database setup for WhatsApp Bot
-- PostgreSQL 17 compatible

-- Create extension for UUID generation if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS "users" (
  "id" serial PRIMARY KEY,
  "whatsapp_id" text NOT NULL UNIQUE,
  "name" text,
  "is_blocked" boolean DEFAULT false,
  "last_seen" timestamp DEFAULT now(),
  "message_count" integer DEFAULT 0,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

-- Messages table
CREATE TABLE IF NOT EXISTS "messages" (
  "id" serial PRIMARY KEY,
  "whatsapp_message_id" text UNIQUE,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "chat_id" text NOT NULL,
  "message_type" text NOT NULL,
  "content" text,
  "metadata" jsonb,
  "is_from_bot" boolean DEFAULT false,
  "timestamp" timestamp DEFAULT now(),
  "created_at" timestamp DEFAULT now()
);

-- Commands table
CREATE TABLE IF NOT EXISTS "commands" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "command" text NOT NULL,
  "parameters" text,
  "success" boolean DEFAULT true,
  "response_time" integer,
  "error_message" text,
  "timestamp" timestamp DEFAULT now()
);

-- Bot settings table
CREATE TABLE IF NOT EXISTS "bot_settings" (
  "id" serial PRIMARY KEY,
  "key" text NOT NULL UNIQUE,
  "value" text,
  "description" text,
  "updated_at" timestamp DEFAULT now()
);

-- Media downloads table
CREATE TABLE IF NOT EXISTS "media_downloads" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "platform" text NOT NULL,
  "original_url" text NOT NULL,
  "download_type" text,
  "file_size" integer,
  "success" boolean DEFAULT true,
  "error_message" text,
  "timestamp" timestamp DEFAULT now()
);

-- AI interactions table
CREATE TABLE IF NOT EXISTS "ai_interactions" (
  "id" serial PRIMARY KEY,
  "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
  "prompt" text NOT NULL,
  "response" text,
  "model" text DEFAULT 'gemini-2.5-flash',
  "tokens_used" integer,
  "response_time" integer,
  "has_grounding" boolean DEFAULT false,
  "grounding_sources" jsonb,
  "success" boolean DEFAULT true,
  "error_message" text,
  "timestamp" timestamp DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "idx_users_whatsapp_id" ON "users"("whatsapp_id");
CREATE INDEX IF NOT EXISTS "idx_messages_user_id" ON "messages"("user_id");
CREATE INDEX IF NOT EXISTS "idx_messages_chat_id" ON "messages"("chat_id");
CREATE INDEX IF NOT EXISTS "idx_messages_timestamp" ON "messages"("timestamp");
CREATE INDEX IF NOT EXISTS "idx_commands_user_id" ON "commands"("user_id");
CREATE INDEX IF NOT EXISTS "idx_commands_command" ON "commands"("command");
CREATE INDEX IF NOT EXISTS "idx_media_downloads_user_id" ON "media_downloads"("user_id");
CREATE INDEX IF NOT EXISTS "idx_ai_interactions_user_id" ON "ai_interactions"("user_id");

-- Insert default bot settings
INSERT INTO "bot_settings" ("key", "value", "description") VALUES
  ('bot_name', 'WhatsApp AI Bot', 'Bot display name'),
  ('welcome_message', '👋 Halo! Saya adalah AI assistant WhatsApp. Ketik /help untuk melihat daftar perintah.', 'Default welcome message'),
  ('ai_enabled', 'true', 'Enable AI responses'),
  ('media_download_enabled', 'true', 'Enable media download features'),
  ('rate_limit_messages', '10', 'Messages per minute limit'),
  ('max_file_size_mb', '50', 'Maximum file size for processing in MB')
ON CONFLICT ("key") DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON "users";
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON "users"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_bot_settings_updated_at ON "bot_settings";
CREATE TRIGGER update_bot_settings_updated_at BEFORE UPDATE ON "bot_settings"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert admin user if ADMIN_PHONE is provided
-- This will be populated by the application based on environment variables
