/*
  Warnings:

  - You are about to drop the column `carreras` on the `students` table. All the data in the column will be lost.
  - You are about to drop the column `materias` on the `students` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "students" DROP COLUMN "carreras",
DROP COLUMN "materias";

-- CreateTable
CREATE TABLE "careers" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "codigo" VARCHAR(50) NOT NULL,
    "icon" VARCHAR(50) NOT NULL DEFAULT 'school',
    "color" VARCHAR(20) NOT NULL DEFAULT '0xFF135D66',
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "careers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_careers" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "career_id" INTEGER NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_careers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "careers_codigo_key" ON "careers"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "student_careers_student_id_career_id_key" ON "student_careers"("student_id", "career_id");

-- AddForeignKey
ALTER TABLE "student_careers" ADD CONSTRAINT "student_careers_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_careers" ADD CONSTRAINT "student_careers_career_id_fkey" FOREIGN KEY ("career_id") REFERENCES "careers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
