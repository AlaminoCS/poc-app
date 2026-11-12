-- AlterTable User
ALTER TABLE "User" ADD COLUMN "name" TEXT;
ALTER TABLE "User" ADD COLUMN "birthDate" DATE;
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';
ALTER TABLE "User" ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable Habit
ALTER TABLE "Habit" ADD COLUMN "frequency" TEXT NOT NULL DEFAULT 'daily';
ALTER TABLE "Habit" ADD COLUMN "weekdays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Habit" ADD COLUMN "monthDay" INTEGER;
ALTER TABLE "Habit" ADD COLUMN "remindAtTime" TEXT;
ALTER TABLE "Habit" ADD COLUMN "remindEnabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable PushSubscription
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh" TEXT NOT NULL,
    "auth" TEXT NOT NULL,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");
CREATE INDEX "PushSubscription_userId_idx" ON "PushSubscription"("userId");

ALTER TABLE "PushSubscription" ADD CONSTRAINT "PushSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ReminderLog
CREATE TABLE "ReminderLog" (
    "id" TEXT NOT NULL,
    "habitId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ReminderLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ReminderLog_habitId_date_key" ON "ReminderLog"("habitId", "date");

ALTER TABLE "ReminderLog" ADD CONSTRAINT "ReminderLog_habitId_fkey" FOREIGN KEY ("habitId") REFERENCES "Habit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ConsentEvent
CREATE TABLE "ConsentEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "anonymousId" TEXT,
    "policyVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipHash" TEXT,

    CONSTRAINT "ConsentEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ConsentEvent_policyVersion_idx" ON "ConsentEvent"("policyVersion");
CREATE INDEX "ConsentEvent_anonymousId_idx" ON "ConsentEvent"("anonymousId");

ALTER TABLE "ConsentEvent" ADD CONSTRAINT "ConsentEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateTable ContactAttempt
CREATE TABLE "ContactAttempt" (
    "id" TEXT NOT NULL,
    "ipHash" TEXT,
    "uaHash" TEXT,
    "turnstileOk" BOOLEAN NOT NULL DEFAULT false,
    "honeypotHit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAttempt_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactAttempt_createdAt_idx" ON "ContactAttempt"("createdAt");
