-- CreateTable
CREATE TABLE "ticket_ratings" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" VARCHAR(500),
    "rated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ticket_ratings_ticket_id_key" ON "ticket_ratings"("ticket_id");

-- AddForeignKey
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints Prisma cannot express (keep them when generating later migrations).
-- This migration was created with --create-only and reviewed: it only adds the ticket_ratings
-- table, its unique index and its foreign key. It removes nothing from U1 (citext, CHECK
-- constraints, the partial unique index priorities_single_default_key), nothing from U2 (the
-- ticket, passage, history and notification CHECK constraints and ticket_sector_passages_open_key)
-- and nothing from U3 (messages_body_length_check), and it alters no existing table.

-- BR2.1: the score is an integer of the fixed scale of 1 to 5.
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_score_range_check" CHECK ("score" BETWEEN 1 AND 5);

-- BR2.2: the comment is optional; when present it holds 1 to 500 characters once the
-- surrounding blank space is removed. The trimmed set is spaces, tabs, carriage returns and
-- line feeds, so the database refuses exactly what the API refuses: the API trims with
-- JavaScript `trim` and stores an empty result as absent, and the default `btrim` would accept
-- a comment made only of line breaks.
ALTER TABLE "ticket_ratings" ADD CONSTRAINT "ticket_ratings_comment_length_check" CHECK ("comment" IS NULL OR char_length(btrim("comment", E' \t\r\n')) BETWEEN 1 AND 500);
