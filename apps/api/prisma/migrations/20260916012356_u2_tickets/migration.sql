-- CreateEnum
CREATE TYPE "ticket_history_field" AS ENUM ('STATUS', 'ASSIGNEE', 'SECTOR', 'PRIORITY');

-- CreateEnum
CREATE TYPE "notification_kind" AS ENUM ('MESSAGE_RECEIVED', 'STATUS_CHANGED', 'ASSIGNEE_CHANGED', 'SECTOR_CHANGED', 'TICKET_REOPENED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" UUID NOT NULL,
    "number" SERIAL NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL,
    "requester_id" UUID NOT NULL,
    "assignee_id" UUID,
    "category_id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,
    "status_id" UUID NOT NULL,
    "priority_id" UUID NOT NULL,
    "opened_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closed_at" TIMESTAMPTZ(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_history_entries" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "field" "ticket_history_field" NOT NULL,
    "previous_value" UUID,
    "new_value" UUID,
    "justification" VARCHAR(500),
    "author_id" UUID NOT NULL,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_history_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_sector_passages" (
    "id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "sector_id" UUID NOT NULL,
    "entered_at" TIMESTAMPTZ(3) NOT NULL,
    "left_at" TIMESTAMPTZ(3),
    "justification" VARCHAR(500),
    "transferred_by_id" UUID,

    CONSTRAINT "ticket_sector_passages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "recipient_id" UUID NOT NULL,
    "ticket_id" UUID NOT NULL,
    "kind" "notification_kind" NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ(3),

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tickets_number_key" ON "tickets"("number");

-- CreateIndex
CREATE INDEX "tickets_requester_id_idx" ON "tickets"("requester_id");

-- CreateIndex
CREATE INDEX "tickets_sector_id_assignee_id_idx" ON "tickets"("sector_id", "assignee_id");

-- CreateIndex
CREATE INDEX "tickets_updated_at_idx" ON "tickets"("updated_at");

-- CreateIndex
CREATE INDEX "ticket_history_entries_ticket_id_occurred_at_idx" ON "ticket_history_entries"("ticket_id", "occurred_at");

-- CreateIndex
CREATE INDEX "ticket_sector_passages_sector_id_ticket_id_idx" ON "ticket_sector_passages"("sector_id", "ticket_id");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_read_created_at_idx" ON "notifications"("recipient_id", "read", "created_at");

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_requester_id_fkey" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_assignee_id_fkey" FOREIGN KEY ("assignee_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "statuses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_priority_id_fkey" FOREIGN KEY ("priority_id") REFERENCES "priorities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history_entries" ADD CONSTRAINT "ticket_history_entries_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_history_entries" ADD CONSTRAINT "ticket_history_entries_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_sector_passages" ADD CONSTRAINT "ticket_sector_passages_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_sector_passages" ADD CONSTRAINT "ticket_sector_passages_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ticket_sector_passages" ADD CONSTRAINT "ticket_sector_passages_transferred_by_id_fkey" FOREIGN KEY ("transferred_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints Prisma cannot express (keep them when generating later migrations).
-- This migration was created with --create-only and reviewed: it adds tables, indexes and
-- foreign keys of U2 and removes nothing from U1 (citext, CHECK constraints and the partial
-- unique index priorities_single_default_key are untouched).

-- BR1.2: title and description are required, with the lengths fixed in entities.md.
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_title_length_check" CHECK (char_length(btrim("title")) BETWEEN 5 AND 120);
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_description_length_check" CHECK (char_length(btrim("description")) BETWEEN 10 AND 2000);

-- BR5.2: a passage is open, or closed together with its justification and its author.
ALTER TABLE "ticket_sector_passages" ADD CONSTRAINT "ticket_sector_passages_exit_check" CHECK (("left_at" IS NULL) = ("justification" IS NULL) AND ("left_at" IS NULL) = ("transferred_by_id" IS NULL));
ALTER TABLE "ticket_sector_passages" ADD CONSTRAINT "ticket_sector_passages_justification_length_check" CHECK ("justification" IS NULL OR char_length(btrim("justification")) BETWEEN 5 AND 500);

-- BR5.2: exactly one open passage per ticket, the sector the ticket is in right now.
CREATE UNIQUE INDEX "ticket_sector_passages_open_key" ON "ticket_sector_passages"("ticket_id") WHERE "left_at" IS NULL;

-- BR5.1: the justification of a history entry belongs to sector changes, and only to them.
ALTER TABLE "ticket_history_entries" ADD CONSTRAINT "ticket_history_entries_justification_check" CHECK (("field" = 'SECTOR') = ("justification" IS NOT NULL));
ALTER TABLE "ticket_history_entries" ADD CONSTRAINT "ticket_history_entries_justification_length_check" CHECK ("justification" IS NULL OR char_length(btrim("justification")) BETWEEN 5 AND 500);

-- entities.md: an entry always records a change, so the two values are never both empty nor equal.
ALTER TABLE "ticket_history_entries" ADD CONSTRAINT "ticket_history_entries_value_change_check" CHECK (("previous_value" IS NOT NULL OR "new_value" IS NOT NULL) AND "previous_value" IS DISTINCT FROM "new_value");

-- SM3: a notification carries the instant it was read exactly when it is read.
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_read_at_check" CHECK ("read" = ("read_at" IS NOT NULL));
