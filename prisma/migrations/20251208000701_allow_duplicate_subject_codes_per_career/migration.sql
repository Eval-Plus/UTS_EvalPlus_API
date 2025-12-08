/*
  Warnings:

  - You are about to drop the column `group_id` on the `evaluations` table. All the data in the column will be lost.
  - You are about to drop the `groups` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_groups` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[codigo,career_id]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "public"."evaluations" DROP CONSTRAINT "evaluations_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_subject_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."groups" DROP CONSTRAINT "groups_teacher_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_groups" DROP CONSTRAINT "user_groups_group_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."user_groups" DROP CONSTRAINT "user_groups_user_id_fkey";

-- DropIndex
DROP INDEX "public"."evaluations_group_id_idx";

-- DropIndex
DROP INDEX "public"."subjects_codigo_key";

-- AlterTable
ALTER TABLE "evaluations" DROP COLUMN "group_id";

-- DropTable
DROP TABLE "public"."groups";

-- DropTable
DROP TABLE "public"."user_groups";

-- CreateIndex
CREATE INDEX "subjects_career_id_idx" ON "subjects"("career_id");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_codigo_career_id_key" ON "subjects"("codigo", "career_id");
