-- AlterTable
ALTER TABLE "user_careers" ADD COLUMN     "periodo" VARCHAR(50);

-- AlterTable
ALTER TABLE "user_subjects" ADD COLUMN     "periodo" VARCHAR(50);

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "first_login_at" TIMESTAMP(3),
ADD COLUMN     "last_login_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "sync_logs" (
    "id" SERIAL NOT NULL,
    "admin_id" INTEGER NOT NULL,
    "tipo" VARCHAR(50) NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "resultado" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sync_logs_tipo_periodo_idx" ON "sync_logs"("tipo", "periodo");

-- CreateIndex
CREATE INDEX "sync_logs_admin_id_idx" ON "sync_logs"("admin_id");

-- AddForeignKey
ALTER TABLE "sync_logs" ADD CONSTRAINT "sync_logs_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
