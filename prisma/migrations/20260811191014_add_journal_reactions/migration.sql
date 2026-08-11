-- CreateTable
CREATE TABLE "JournalReaction" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JournalReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "JournalReaction_toUserId_seen_idx" ON "JournalReaction"("toUserId", "seen");

-- CreateIndex
CREATE UNIQUE INDEX "JournalReaction_fromUserId_toUserId_dateKey_key" ON "JournalReaction"("fromUserId", "toUserId", "dateKey");

-- AddForeignKey
ALTER TABLE "JournalReaction" ADD CONSTRAINT "JournalReaction_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JournalReaction" ADD CONSTRAINT "JournalReaction_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
