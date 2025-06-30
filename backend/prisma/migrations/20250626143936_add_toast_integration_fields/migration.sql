-- AlterTable
ALTER TABLE "menu_items" ADD COLUMN     "externalIds" JSONB DEFAULT '{}',
ADD COLUMN     "toastItemGuid" TEXT;

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "externalOrderData" JSONB DEFAULT '{}',
ADD COLUMN     "integrationStatus" TEXT,
ADD COLUMN     "toastOrderGuid" TEXT;

-- AlterTable
ALTER TABLE "restaurants" ADD COLUMN     "externalIntegrations" JSONB DEFAULT '{}',
ADD COLUMN     "integrationEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "toastLocationGuid" TEXT;

-- CreateTable
CREATE TABLE "integration_configs" (
    "id" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "integrationType" TEXT NOT NULL,
    "configData" JSONB NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastSyncAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_configs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "integration_configs_restaurantId_integrationType_key" ON "integration_configs"("restaurantId", "integrationType");

-- AddForeignKey
ALTER TABLE "integration_configs" ADD CONSTRAINT "integration_configs_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "restaurants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
