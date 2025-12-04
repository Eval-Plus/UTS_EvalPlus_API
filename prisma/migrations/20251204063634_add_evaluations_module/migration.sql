-- CreateTable
CREATE TABLE "evaluation_templates" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluation_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "questions" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "categoria" VARCHAR(100) NOT NULL,
    "aspecto" VARCHAR(100) NOT NULL,
    "nro_pregunta" INTEGER NOT NULL,
    "enunciado" TEXT NOT NULL,
    "tipo_respuesta" VARCHAR(50) NOT NULL DEFAULT 'escala',
    "valor_minimo" INTEGER DEFAULT 1,
    "valor_maximo" INTEGER DEFAULT 5,
    "es_obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "template_id" INTEGER NOT NULL,
    "subject_id" INTEGER NOT NULL,
    "teacher_id" INTEGER NOT NULL,
    "periodo" VARCHAR(50) NOT NULL,
    "fecha_inicio" TIMESTAMP(3) NOT NULL,
    "fecha_cierre" TIMESTAMP(3) NOT NULL,
    "es_obligatoria" BOOLEAN NOT NULL DEFAULT true,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_evaluations" (
    "id" SERIAL NOT NULL,
    "evaluation_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "completada" BOOLEAN NOT NULL DEFAULT false,
    "comentario" TEXT,
    "fecha_inicio" TIMESTAMP(3),
    "fecha_completa" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "responses" (
    "id" SERIAL NOT NULL,
    "student_evaluation_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "valor_numerico" INTEGER,
    "valor_texto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "responses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "questions_template_id_nro_pregunta_key" ON "questions"("template_id", "nro_pregunta");

-- CreateIndex
CREATE INDEX "evaluations_teacher_id_periodo_idx" ON "evaluations"("teacher_id", "periodo");

-- CreateIndex
CREATE INDEX "evaluations_fecha_inicio_fecha_cierre_idx" ON "evaluations"("fecha_inicio", "fecha_cierre");

-- CreateIndex
CREATE UNIQUE INDEX "evaluations_subject_id_teacher_id_periodo_key" ON "evaluations"("subject_id", "teacher_id", "periodo");

-- CreateIndex
CREATE INDEX "student_evaluations_student_id_completada_idx" ON "student_evaluations"("student_id", "completada");

-- CreateIndex
CREATE UNIQUE INDEX "student_evaluations_evaluation_id_student_id_key" ON "student_evaluations"("evaluation_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "responses_student_evaluation_id_question_id_key" ON "responses"("student_evaluation_id", "question_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "evaluation_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluations" ADD CONSTRAINT "student_evaluations_evaluation_id_fkey" FOREIGN KEY ("evaluation_id") REFERENCES "evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_evaluations" ADD CONSTRAINT "student_evaluations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_student_evaluation_id_fkey" FOREIGN KEY ("student_evaluation_id") REFERENCES "student_evaluations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "responses" ADD CONSTRAINT "responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
