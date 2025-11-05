-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "google_id" VARCHAR(255),
    "nombre_completo" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "profile_picture" TEXT,
    "identificacion" VARCHAR(50),
    "carreras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_profile_complete" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_google_id_key" ON "students"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_email_key" ON "students"("email");

-- CreateIndex
CREATE UNIQUE INDEX "students_identificacion_key" ON "students"("identificacion");
