-- CreateTable
CREATE TABLE "User" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "name" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Category" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockType" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "categoryId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "BlockType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlan" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "weekStart" TIMESTAMP(3) NOT NULL,
  "weekEnd" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WeeklyPlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeeklyPlanItem" (
  "id" TEXT NOT NULL,
  "weeklyPlanId" TEXT NOT NULL,
  "blockTypeId" TEXT NOT NULL,
  "targetCount" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "WeeklyPlanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockInstance" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "blockTypeId" TEXT NOT NULL,
  "completedAt" TIMESTAMP(3) NOT NULL,
  "scheduledAt" TIMESTAMP(3),
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "BlockInstance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
CREATE INDEX "BlockType_userId_idx" ON "BlockType"("userId");
CREATE INDEX "BlockType_categoryId_idx" ON "BlockType"("categoryId");
CREATE UNIQUE INDEX "BlockType_userId_name_key" ON "BlockType"("userId", "name");
CREATE INDEX "WeeklyPlan_userId_idx" ON "WeeklyPlan"("userId");
CREATE UNIQUE INDEX "WeeklyPlan_userId_weekStart_key" ON "WeeklyPlan"("userId", "weekStart");
CREATE INDEX "WeeklyPlanItem_weeklyPlanId_idx" ON "WeeklyPlanItem"("weeklyPlanId");
CREATE INDEX "WeeklyPlanItem_blockTypeId_idx" ON "WeeklyPlanItem"("blockTypeId");
CREATE UNIQUE INDEX "WeeklyPlanItem_weeklyPlanId_blockTypeId_key" ON "WeeklyPlanItem"("weeklyPlanId", "blockTypeId");
CREATE INDEX "BlockInstance_userId_idx" ON "BlockInstance"("userId");
CREATE INDEX "BlockInstance_blockTypeId_idx" ON "BlockInstance"("blockTypeId");
CREATE INDEX "BlockInstance_completedAt_idx" ON "BlockInstance"("completedAt");

-- AddForeignKey
ALTER TABLE "BlockType" ADD CONSTRAINT "BlockType_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockType" ADD CONSTRAINT "BlockType_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlan" ADD CONSTRAINT "WeeklyPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_weeklyPlanId_fkey" FOREIGN KEY ("weeklyPlanId") REFERENCES "WeeklyPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeeklyPlanItem" ADD CONSTRAINT "WeeklyPlanItem_blockTypeId_fkey" FOREIGN KEY ("blockTypeId") REFERENCES "BlockType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlockInstance" ADD CONSTRAINT "BlockInstance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlockInstance" ADD CONSTRAINT "BlockInstance_blockTypeId_fkey" FOREIGN KEY ("blockTypeId") REFERENCES "BlockType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
