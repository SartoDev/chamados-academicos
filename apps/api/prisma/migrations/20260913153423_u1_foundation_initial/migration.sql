-- U1 foundation: users, sectors, categories, statuses and priorities.
-- Case-insensitive names and labels rely on the citext extension.
CREATE EXTENSION IF NOT EXISTS citext;

-- CreateEnum
CREATE TYPE "role" AS ENUM ('STUDENT', 'PROFESSOR', 'AGENT', 'MANAGER', 'ADMIN');

-- CreateEnum
CREATE TYPE "status_key" AS ENUM ('OPEN', 'IN_ANALYSIS', 'WAITING_REQUESTER', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "role" NOT NULL,
    "sector_id" UUID,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sectors" (
    "id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "sectors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "name" CITEXT NOT NULL,
    "sector_id" UUID NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "statuses" (
    "id" UUID NOT NULL,
    "key" "status_key" NOT NULL,
    "label" CITEXT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "statuses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "priorities" (
    "id" UUID NOT NULL,
    "label" CITEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "priorities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_sector_id_idx" ON "users"("sector_id");

-- CreateIndex
CREATE INDEX "users_role_active_idx" ON "users"("role", "active");

-- CreateIndex
CREATE UNIQUE INDEX "sectors_name_key" ON "sectors"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_sector_id_name_key" ON "categories"("sector_id", "name");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_key_key" ON "statuses"("key");

-- CreateIndex
CREATE UNIQUE INDEX "statuses_label_key" ON "statuses"("label");

-- CreateIndex
CREATE UNIQUE INDEX "priorities_label_key" ON "priorities"("label");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_sector_id_fkey" FOREIGN KEY ("sector_id") REFERENCES "sectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Constraints Prisma cannot express (keep them when generating later migrations).

-- BR1.1: e-mails are stored normalized (trimmed, lowercase).
ALTER TABLE "users" ADD CONSTRAINT "users_email_normalized_check" CHECK ("email" = lower(btrim("email")) AND char_length("email") > 0);
ALTER TABLE "users" ADD CONSTRAINT "users_name_not_blank_check" CHECK (char_length(btrim("name")) > 0);

-- BR3.3: AGENT and MANAGER always have a sector; every other role never has one.
ALTER TABLE "users" ADD CONSTRAINT "users_role_sector_check" CHECK (("role" IN ('AGENT', 'MANAGER')) = ("sector_id" IS NOT NULL));

-- BR4.1: names and labels are required, with the lengths fixed in entities.md.
ALTER TABLE "sectors" ADD CONSTRAINT "sectors_name_length_check" CHECK (char_length(btrim("name"::text)) BETWEEN 1 AND 80);
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_length_check" CHECK (char_length(btrim("name"::text)) BETWEEN 1 AND 80);
ALTER TABLE "statuses" ADD CONSTRAINT "statuses_label_length_check" CHECK (char_length(btrim("label"::text)) BETWEEN 1 AND 40);
ALTER TABLE "priorities" ADD CONSTRAINT "priorities_label_length_check" CHECK (char_length(btrim("label"::text)) BETWEEN 1 AND 40);

-- BR4.7: at most one default priority.
CREATE UNIQUE INDEX "priorities_single_default_key" ON "priorities"("is_default") WHERE "is_default";
