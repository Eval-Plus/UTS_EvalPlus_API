import { PrismaClient } from '@prisma/client';
import { rolesData, careersData, subjectsData, questionsData } from './data.js';

const prisma = new PrismaClient();

// Constante de Periodo Academico actual;
const CURRENT_PERIOD = '2025-1';

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Función auxiliar para logging con emojis
 */
const log = {
  info: (msg) => console.log(`  ℹ️  ${msg}`),
  success: (msg) => console.log(`  ✅ ${msg}`),
  warning: (msg) => console.log(`  ⚠️  ${msg}`),
  exists: (msg) => console.log(`  ⭐️ ${msg}`),
  section: (msg) => console.log(`\n🌱 ${msg}`),
  subsection: (msg) => console.log(`\n  📚 ${msg}`),
  complete: (msg) => console.log(`✅ ${msg}\n`),
  empty: (msg) => console.log(`  📭 ${msg}`)
};

// ==========================================
// FUNCIONES DE SEED
// ==========================================

/**
 * Seed de Roles
 */
async function seedRoles() {
  log.section('Seeding roles...');

  for (const role of rolesData) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name }
    });

    if (!existing) {
      await prisma.role.create({ data: role });
      log.success(`Rol creado: ${role.displayName}`);
    } else {
      log.exists(`Rol ya existe: ${role.displayName}`);
    }
  }

  log.complete('Roles procesados');
}

/**
 * Seed de Carreras
 */
async function seedCareers() {
  log.section('Seeding careers...');

  const createdCareers = [];
  
  for (const career of careersData) {
    const existing = await prisma.career.findUnique({
      where: { codigo: career.codigo }
    });

    if (!existing) {
      const created = await prisma.career.create({ data: career });
      createdCareers.push(created);
      log.success(`Carrera creada: ${created.nombre}`);
    } else {
      log.exists(`Carrera ya existe: ${existing.nombre}`);
      createdCareers.push(existing);
    }
  }

  log.complete(`${createdCareers.length} carreras procesadas`);
  return createdCareers;
}

/**
 * Seed de Materias
 */
async function seedSubjects() {
  log.section('Seeding subjects...');

  // Obtener mapa de carreras
  const careers = await prisma.career.findMany();
  const careerMap = Object.fromEntries(
    careers.map(c => [c.codigo, c.id])
  );

  if (careers.length === 0) {
    log.warning('No hay carreras en la BD. Ejecuta seedCareers primero.');
    return [];
  }

  let totalCreated = 0;

  // Crear materias para cada carrera
  for (const [careerCode, subjects] of Object.entries(subjectsData)) {
    const careerId = careerMap[careerCode];
    
    if (!careerId) {
      log.warning(`Carrera ${careerCode} no encontrada, omitiendo materias...`);
      continue;
    }

    if (subjects.length === 0) {
      log.empty(`${careerCode}: Sin materias definidas (agregar después)`);
      continue;
    }

    log.subsection(`Procesando materias de ${careerCode}:`);

    for (const subject of subjects) {
      const existing = await prisma.subject.findUnique({
        where: {
          codigo_careerId: {
            codigo: subject.codigo,
            careerId: careerId
          }
        }
      });

      if (!existing) {
        await prisma.subject.create({
          data: {
            ...subject,
            careerId
          }
        });
        log.success(`${subject.nombre} (${subject.codigo})`);
        totalCreated++;
      } else {
        log.exists(`${subject.nombre} ya existe`);
      }
    }
  }

  log.complete(`${totalCreated} materias creadas en total`);
}

/**
 * Seed de Plantilla de Evaluación y Preguntas
 */
async function seedEvaluationTemplate() {
  log.section('Seeding evaluation template and questions...');

  // 1. Crear plantilla base
  let template = await prisma.evaluationTemplate.findFirst({
    where: { nombre: 'Evaluación Docente Estándar' }
  });

  if (!template) {
    template = await prisma.evaluationTemplate.create({
      data: {
        nombre: 'Evaluación Docente Estándar',
        descripcion: 'Plantilla estándar para evaluación de desempeño docente',
        activo: true
      }
    });
    log.success(`Plantilla creada: ${template.nombre}`);
  } else {
    log.exists(`Plantilla ya existe: ${template.nombre}`);
  }

  // 2. Crear preguntas
  let createdCount = 0;
  
  for (const question of questionsData) {
    const existing = await prisma.question.findUnique({
      where: {
        templateId_nroPregunta: {
          templateId: template.id,
          nroPregunta: question.nroPregunta
        }
      }
    });

    if (!existing) {
      await prisma.question.create({
        data: {
          ...question,
          templateId: template.id
        }
      });
      createdCount++;
      log.success(`Pregunta ${question.nroPregunta}: ${question.enunciado.substring(0, 50)}...`);
    } else {
      log.exists(`Pregunta ${question.nroPregunta} ya existe`);
    }
  }

  log.complete(`${createdCount} preguntas creadas`);
}

// ==========================================
// FUNCIÓN PRINCIPAL
// ==========================================

/**
 * Función principal de seed
 */
async function main() {
  console.log('\n🚀 Iniciando seed de la base de datos...\n');

  try {
    await seedRoles();
    await seedCareers();
    await seedSubjects();
    await seedEvaluationTemplate();

    console.log('🎉 Seed completado exitosamente!\n');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// ==========================================
// EJECUCIÓN
// ==========================================

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
