-- CreateTable
CREATE TABLE IF NOT EXISTS "TaskCompletionLog" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "workerId" TEXT,
    "source" TEXT NOT NULL DEFAULT 'telegram',
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletionLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskCompletionLog_taskId_idx" ON "TaskCompletionLog"("taskId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "TaskCompletionLog_workerId_idx" ON "TaskCompletionLog"("workerId");

-- CreateIndex (unique constraint for idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS "TaskCompletionLog_taskId_workerId_source_key" ON "TaskCompletionLog"("taskId", "workerId", "source");

-- AddForeignKey
ALTER TABLE "TaskCompletionLog" ADD CONSTRAINT "TaskCompletionLog_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskCompletionLog" ADD CONSTRAINT "TaskCompletionLog_workerId_fkey" FOREIGN KEY ("workerId") REFERENCES "Worker"("id") ON DELETE SET NULL ON UPDATE CASCADE;
