-- AlterTable
ALTER TABLE "student_evaluations" ADD COLUMN     "sentiment" VARCHAR(20),
ADD COLUMN     "sentiment_analyzed_at" TIMESTAMP(3),
ADD COLUMN     "sentiment_score" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "student_evaluations_sentiment_idx" ON "student_evaluations"("sentiment");
