-- CreateTable
CREATE TABLE "SavedTagOption" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTagOption_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedTagOption_userId_field_idx" ON "SavedTagOption"("userId", "field");

-- CreateIndex
CREATE UNIQUE INDEX "SavedTagOption_userId_field_value_key" ON "SavedTagOption"("userId", "field", "value");

-- AddForeignKey
ALTER TABLE "SavedTagOption" ADD CONSTRAINT "SavedTagOption_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
