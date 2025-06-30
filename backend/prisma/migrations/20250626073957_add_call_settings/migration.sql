-- AlterTable
ALTER TABLE "call_logs" ADD COLUMN     "cost" DECIMAL(5,4),
ADD COLUMN     "keypadResponse" TEXT,
ADD COLUMN     "responseType" TEXT,
ADD COLUMN     "twilioCallSid" TEXT;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "callPhone" TEXT,
ADD COLUMN     "callRetries" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "callTimeoutSeconds" INTEGER NOT NULL DEFAULT 30;
