-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "nombre_completo" VARCHAR(255) NOT NULL,
    "identificacion" VARCHAR(50) NOT NULL,
    "carreras" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "materias" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correo" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "students_identificacion_key" ON "students"("identificacion");

-- CreateIndex
CREATE UNIQUE INDEX "students_correo_key" ON "students"("correo");
