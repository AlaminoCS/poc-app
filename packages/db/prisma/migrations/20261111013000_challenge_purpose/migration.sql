-- AlterTable
ALTER TABLE "LoginChallenge" ADD COLUMN "purpose" TEXT NOT NULL DEFAULT 'login';

-- CreateIndex
CREATE INDEX "LoginChallenge_purpose_idx" ON "LoginChallenge"("purpose");
