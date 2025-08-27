CREATE TABLE IF NOT EXISTS "_prisma_migrations" (
    "id"                    TEXT PRIMARY KEY NOT NULL,
    "checksum"              TEXT NOT NULL,
    "finished_at"           DATETIME,
    "migration_name"        TEXT NOT NULL,
    "logs"                  TEXT,
    "rolled_back_at"        DATETIME,
    "started_at"            DATETIME NOT NULL DEFAULT current_timestamp,
    "applied_steps_count"   INTEGER UNSIGNED NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "picture" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'Basic',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE TABLE IF NOT EXISTS "api_keys" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "lastUsed" DATETIME,
    "totalHits" INTEGER NOT NULL DEFAULT 0,
    "userId" TEXT NOT NULL,
    CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "api_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "statusCode" INTEGER NOT NULL,
    "responseTime" INTEGER,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "requestSize" INTEGER,
    "responseSize" INTEGER,
    "errorMessage" TEXT,
    "userId" TEXT NOT NULL,
    "apiKeyId" TEXT NOT NULL,
    CONSTRAINT "api_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "api_logs_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "api_endpoints" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "path" TEXT NOT NULL,
    "wrapperUrl" TEXT NOT NULL,
    "originalUrl" TEXT NOT NULL,
    "menuName" TEXT NOT NULL,
    "pageName" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");
CREATE INDEX "api_logs_userId_timestamp_idx" ON "api_logs"("userId", "timestamp");
CREATE INDEX "api_logs_apiKeyId_timestamp_idx" ON "api_logs"("apiKeyId", "timestamp");
CREATE INDEX "api_logs_endpoint_timestamp_idx" ON "api_logs"("endpoint", "timestamp");
CREATE UNIQUE INDEX "api_endpoints_path_key" ON "api_endpoints"("path");
CREATE INDEX "api_endpoints_menuName_pageName_idx" ON "api_endpoints"("menuName", "pageName");
