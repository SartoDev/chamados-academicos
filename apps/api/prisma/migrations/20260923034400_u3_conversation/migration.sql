-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "author_id" UUID NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "sent_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "messages_ticket_id_sent_at_id_idx" ON "messages"("ticket_id", "sent_at", "id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints Prisma cannot express (keep them when generating later migrations).
-- This migration was created with --create-only and reviewed: it only adds the messages table,
-- its index and its two foreign keys. It removes nothing from U1 (citext, CHECK constraints,
-- the partial unique index priorities_single_default_key) and nothing from U2 (the ticket,
-- passage, history and notification CHECK constraints and ticket_sector_passages_open_key),
-- and it alters no existing table.

-- BR2.1: the body is required and holds 1 to 2000 characters once the surrounding blank space
-- is removed. The trimmed set is spaces, tabs, carriage returns and line feeds, so the database
-- refuses exactly what the API refuses: the API trims with JavaScript `trim` before storing, and
-- the default `btrim` would accept a body made only of line breaks.
ALTER TABLE "messages" ADD CONSTRAINT "messages_body_length_check" CHECK (char_length(btrim("body", E' \t\r\n')) BETWEEN 1 AND 2000);
