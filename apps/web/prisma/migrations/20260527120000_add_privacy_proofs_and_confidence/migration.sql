-- Add privacy controls to users.
ALTER TABLE "User"
ADD COLUMN     "currentProject" TEXT,
ADD COLUMN     "showPresence" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "trackingPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "redactWindowTitles" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "excludedApps" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "hiddenApps" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "privateProjects" JSONB NOT NULL DEFAULT '[]';

-- Add confidence/source metadata to sessions.
ALTER TABLE "Session"
ADD COLUMN     "projectName" TEXT,
ADD COLUMN     "source" TEXT NOT NULL DEFAULT 'active_window',
ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0.4,
ADD COLUMN     "proofId" TEXT;

-- Create proof objects that can be linked to sessions and shown publicly.
CREATE TABLE "ProofObject" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "projectName" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'build_note',
    "summary" TEXT,
    "note" TEXT,
    "repoUrl" TEXT,
    "pullRequestUrl" TEXT,
    "deploymentUrl" TEXT,
    "demoUrl" TEXT,
    "screenshotUrl" TEXT,
    "changelogUrl" TEXT,
    "commitRange" TEXT,
    "shippedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isPublic" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProofObject_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Session_userId_source_idx" ON "Session"("userId", "source");
CREATE INDEX "Session_proofId_idx" ON "Session"("proofId");
CREATE INDEX "ProofObject_userId_shippedAt_idx" ON "ProofObject"("userId", "shippedAt");
CREATE INDEX "ProofObject_isPublic_shippedAt_idx" ON "ProofObject"("isPublic", "shippedAt");

ALTER TABLE "ProofObject" ADD CONSTRAINT "ProofObject_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_proofId_fkey" FOREIGN KEY ("proofId") REFERENCES "ProofObject"("id") ON DELETE SET NULL ON UPDATE CASCADE;
