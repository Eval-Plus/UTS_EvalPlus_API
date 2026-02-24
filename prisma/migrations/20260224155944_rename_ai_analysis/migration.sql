/*
  Warnings:

  - You are about to drop the `ai_analyses` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."ai_analyses" DROP CONSTRAINT "ai_analyses_teacher_id_fkey";

-- DropTable
DROP TABLE "public"."ai_analyses";

-- CreateTable
CREATE TABLE "ai_analysis" (
    "id" SERIAL NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "profile" TEXT NOT NULL,
    "strengths" JSONB NOT NULL,
    "improvements" JSONB NOT NULL,
    "recommendations" JSONB NOT NULL,
    "analysis_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "model_version" VARCHAR(100) NOT NULL DEFAULT 'meta-llama/Llama-3.2-3B-Instruct',
    "evaluations_count" INTEGER NOT NULL,
    "responses_count" INTEGER NOT NULL,
    "average_score" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_analysis_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_analysis_teacher_id_idx" ON "ai_analysis"("teacher_id");

-- CreateIndex
CREATE INDEX "ai_analysis_periodo_idx" ON "ai_analysis"("periodo");

-- CreateIndex
CREATE UNIQUE INDEX "ai_analysis_teacher_id_periodo_key" ON "ai_analysis"("teacher_id", "periodo");

-- AddForeignKey
ALTER TABLE "ai_analysis" ADD CONSTRAINT "ai_analysis_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
