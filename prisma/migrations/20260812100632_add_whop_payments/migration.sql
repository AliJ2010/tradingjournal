-- AlterTable
ALTER TABLE "User" ADD COLUMN     "aiMessagesUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "aiPeriodEnd" TIMESTAMP(3),
ADD COLUMN     "aiPeriodStart" TIMESTAMP(3),
ADD COLUMN     "whopMembershipId" TEXT,
ADD COLUMN     "whopUserId" TEXT;

-- AlterTable
ALTER TABLE "DiscountCode" ADD COLUMN     "endsAt" TIMESTAMP(3),
ADD COLUMN     "planKeys" TEXT NOT NULL DEFAULT '[]',
ADD COLUMN     "startsAt" TIMESTAMP(3),
ADD COLUMN     "whopPromoCodeId" TEXT;

-- AlterTable
ALTER TABLE "CreatorCode" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "whopAffiliateCode" TEXT,
ADD COLUMN     "whopAffiliateId" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "convertedAt" TIMESTAMP(3),
ADD COLUMN     "firstTouchAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'attributed';

-- CreateTable
CREATE TABLE "CreatorPlanRule" (
    "id" TEXT NOT NULL,
    "creatorCodeId" TEXT NOT NULL,
    "planKey" TEXT NOT NULL,
    "whopPromoCodeId" TEXT,
    "whopPromoCode" TEXT NOT NULL,
    "discountType" TEXT NOT NULL DEFAULT 'percent',
    "discountValue" DOUBLE PRECISION NOT NULL,
    "commissionType" TEXT NOT NULL DEFAULT 'percent',
    "commissionValue" DOUBLE PRECISION NOT NULL,
    "commissionDuration" TEXT NOT NULL DEFAULT 'first_payment',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreatorPlanRule_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'whop',
    "whopMembershipId" TEXT NOT NULL,
    "whopPlanId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'whop',
    "whopPaymentId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "planKey" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "creatorCodeId" TEXT,
    "promoCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'whop',
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CreatorPlanRule_creatorCodeId_planKey_key" ON "CreatorPlanRule"("creatorCodeId", "planKey");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_whopMembershipId_key" ON "Subscription"("whopMembershipId");

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_whopPaymentId_key" ON "Payment"("whopPaymentId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE UNIQUE INDEX "User_whopUserId_key" ON "User"("whopUserId");

-- AddForeignKey
ALTER TABLE "CreatorPlanRule" ADD CONSTRAINT "CreatorPlanRule_creatorCodeId_fkey" FOREIGN KEY ("creatorCodeId") REFERENCES "CreatorCode"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

┌─────────────────────────────────────────────────────────┐
│  Update available 5.22.0 -> 7.9.1                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘
