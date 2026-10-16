CREATE TYPE "WorkItemStatus" AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELED');

CREATE TABLE "WorkItem" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "status" "WorkItemStatus" NOT NULL DEFAULT 'TODO',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "WorkItem_organizationId_status_createdAt_idx"
  ON "WorkItem"("organizationId", "status", "createdAt");

ALTER TABLE "WorkItem"
  ADD CONSTRAINT "WorkItem_organizationId_fkey"
  FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
