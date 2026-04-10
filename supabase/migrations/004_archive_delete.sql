-- Migration: Add archive & delete support for conversations
-- The status column is text, so 'archived' works without ALTER TYPE.
-- We just add an index for efficient filtering of archived conversations.

CREATE INDEX IF NOT EXISTS idx_conversations_archived
  ON conversations (status)
  WHERE status = 'archived';

-- Allow cascade delete of conversations (messages, drafts, activity_log)
-- First drop existing FK constraints if they exist, then re-add with CASCADE
DO $$
BEGIN
  -- messages → conversations
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'messages_conversation_id_fkey'
  ) THEN
    ALTER TABLE messages DROP CONSTRAINT messages_conversation_id_fkey;
    ALTER TABLE messages ADD CONSTRAINT messages_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;

  -- ai_drafts → conversations
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'ai_drafts_conversation_id_fkey'
  ) THEN
    ALTER TABLE ai_drafts DROP CONSTRAINT ai_drafts_conversation_id_fkey;
    ALTER TABLE ai_drafts ADD CONSTRAINT ai_drafts_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;

  -- activity_log → conversations
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'activity_log_conversation_id_fkey'
  ) THEN
    ALTER TABLE activity_log DROP CONSTRAINT activity_log_conversation_id_fkey;
    ALTER TABLE activity_log ADD CONSTRAINT activity_log_conversation_id_fkey
      FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE;
  END IF;
END $$;
