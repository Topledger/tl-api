-- CreateTable or AlterTable: Add credits column to users table
-- Migration: add_credits_to_users

-- Add credits column to users table with default value of 5000
ALTER TABLE "users" ADD COLUMN "credits" INTEGER NOT NULL DEFAULT 5000;

-- Update existing users to have 5000 credits if they don't already have credits set
UPDATE "users" SET "credits" = 5000 WHERE "credits" IS NULL;
