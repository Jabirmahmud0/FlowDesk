-- Add API Keys table
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    "org_id" uuid NOT NULL REFERENCES "organizations"("id") ON DELETE cascade,
    "name" varchar(100) NOT NULL,
    "key" text NOT NULL UNIQUE,
    "partial_key" varchar(20) NOT NULL,
    "created_by" uuid NOT NULL REFERENCES "users"("id"),
    "revoked" boolean DEFAULT false,
    "revoked_at" timestamp,
    "last_used_at" timestamp,
    "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "api_keys_org_id_idx" ON "api_keys" USING btree ("org_id");
CREATE UNIQUE INDEX IF NOT EXISTS "api_keys_key_idx" ON "api_keys" USING btree ("key");
