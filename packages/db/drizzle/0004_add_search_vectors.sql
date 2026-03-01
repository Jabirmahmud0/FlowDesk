-- Add search_vector column to tasks table
ALTER TABLE "tasks" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Add search_vector column to documents table
ALTER TABLE "documents" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Add search_vector column to activity_log table
ALTER TABLE "activity_log" ADD COLUMN IF NOT EXISTS "search_vector" tsvector;

-- Create indexes (after columns are added)
CREATE INDEX IF NOT EXISTS "tasks_search_idx" ON "tasks" USING gin ("search_vector");
CREATE INDEX IF NOT EXISTS "documents_search_idx" ON "documents" USING gin ("search_vector");
CREATE INDEX IF NOT EXISTS "activity_log_search_idx" ON "activity_log" USING gin ("search_vector");
