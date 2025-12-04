import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed de Roles
 */
async function seedRoles() {
  console.log('🌱 Seeding roles...');

  const roles = [
    { name: 'STUDENT', displayName: 'Estudiante', description: 'Usuario con rol de estudiante' },
    { name: 'TEACHER', displayName: 'Profesor', description: 'Usuario con rol de profesor' },
    { name: 'ADMIN', displayName: 'Administrador', description: 'Usuario con permisos administrativos' }
  ];

  for (const role of roles) {
    const existing = await prisma.role.findUnique({
      where: { name: role.name }
    });

    if (!existing) {
      await prisma.role.create({ data: role });
      console.log(`  ✅ Rol creado: ${role.displayName}`);
    } else {
      console.log(`  ⏭️  Rol ya existe: ${role.displayName}`);
    }
  }

  console.log('✅ Roles procesados\n');
}

/**
 * Seed de Carreras
 */
async function seedCareers() {
  console.log('🌱 Seeding careers...');

  const careers = [
    {
      nombre: 'Ingeniería de Sistemas',
      codigo: 'ING-SIS',
      icon: 'computer',
      color: '0xFF2196F3',
      descripcion: 'Carrera enfocada en el desarrollo de software y sistemas informáticos'
    },
    {
      nombre: 'Administración de Empresas',
      codigo: 'ADM-EMP',
      icon: 'business_center',
      color: '0xFF4CAF50',
      descripcion: 'Formación integral en gestión empresarial y administrativa'
    },
    {
      nombre: 'Derecho',
      codigo: 'DER',
      icon: 'gavel',
      color: '0xFF9C27B0',
      descripcion: 'Carrera de ciencias jurídicas y formación legal'
    },
    {
      nombre: 'Contaduría Pública',
      codigo: 'CON-PUB',
      icon: 'account_balance',
      color: '0xFF2E7D32',
      descripcion: 'Especialización en contabilidad, auditoría y finanzas'
    },
    {
      nombre: 'Ingeniería Industrial',
      codigo: 'ING-IND',
      icon: 'precision_manufacturing',
      color: '0xFFD32F2F',
      descripcion: 'Optimización de procesos productivos y gestión industrial'
    }
  ];

  const createdCareers = [];
  
  for (const career of careers) {
    const existing = await prisma.career.findUnique({
      where: { codigo: career.codigo }
    });

    if (!existing) {
      const created = await prisma.career.create({
        data: career
      });
      createdCareers.push(created);
      console.log(`  ✅ Carrera creada: ${created.nombre}`);
    } else {
      console.log(`  ⏭️  Carrera ya existe: ${existing.nombre}`);
      createdCareers.push(existing);
    }
  }

  console.log(`✅ ${createdCareers.length} carreras procesadas\n`);
  return createdCareers;
}

/**
 * Seed de Materias
 */
async function seedSubjects() {
  console.log('🌱 Seeding subjects...');

  // Obtener todas las carreras
  const careers = await prisma.career.findMany();
  const careerMap = Object.fromEntries(
    careers.map(c => [c.codigo, c.id])
  );

  if (careers.length === 0) {
    console.log('  ⚠️  No hay carreras en la BD. Ejecuta seedCareers primero.');
    return [];
  }

  // Materias por carrera
  const subjectsData = {
    'ING-SIS': [
      {
        nombre: 'Fundamentos de Programación',
        codigo: 'SIS-101',
        semestre: 1,
        descripcion: 'Introducción a los conceptos básicos de programación y algoritmos'
      },
      {
        nombre: 'Estructuras de Datos',
        codigo: 'SIS-201',
        semestre: 2,
        descripcion: 'Estudio de estructuras de datos fundamentales: listas, pilas, colas, árboles'
      },
      {
        nombre: 'Programación Orientada a Objetos',
        codigo: 'SIS-301',
        semestre: 3,
        descripcion: 'Paradigma de programación orientada a objetos con Java y Python'
      },
      {
        nombre: 'Bases de Datos',
        codigo: 'SIS-401',
        semestre: 4,
        descripcion: 'Diseño, implementación y gestión de bases de datos relacionales'
      },
      {
        nombre: 'Desarrollo Web',
        codigo: 'SIS-501',
        semestre: 5,
        descripcion: 'Desarrollo de aplicaciones web con HTML, CSS, JavaScript y frameworks modernos'
      },
      {
        nombre: 'Ingeniería de Software',
        codigo: 'SIS-601',
        semestre: 6,
        descripcion: 'Metodologías ágiles, arquitectura de software y gestión de proyectos'
      }
    ],
    'ADM-EMP': [
      {
        nombre: 'Introducción a la Administración',
        codigo: 'ADM-101',
        semestre: 1,
        descripcion: 'Conceptos fundamentales de la administración empresarial'
      },
      {
        nombre: 'Contabilidad General',
        codigo: 'ADM-201',
        semestre: 2,
        descripcion: 'Principios básicos de contabilidad y estados financieros'
      },
      {
        nombre: 'Marketing Estratégico',
        codigo: 'ADM-301',
        semestre: 3,
        descripcion: 'Estrategias de marketing y comportamiento del consumidor'
      },
      {
        nombre: 'Gestión de Recursos Humanos',
        codigo: 'ADM-401',
        semestre: 4,
        descripcion: 'Administración del talento humano en las organizaciones'
      },
      {
        nombre: 'Finanzas Corporativas',
        codigo: 'ADM-501',
        semestre: 5,
        descripcion: 'Análisis financiero y decisiones de inversión empresarial'
      },
      {
        nombre: 'Dirección Estratégica',
        codigo: 'ADM-601',
        semestre: 6,
        descripcion: 'Planeación estratégica y toma de decisiones gerenciales'
      }
    ],
    'DER': [
      {
        nombre: 'Introducción al Derecho',
        codigo: 'DER-101',
        semestre: 1,
        descripcion: 'Fundamentos del derecho y sistemas jurídicos'
      },
      {
        nombre: 'Derecho Civil I',
        codigo: 'DER-201',
        semestre: 2,
        descripcion: 'Personas, familia y obligaciones civiles'
      },
      {
        nombre: 'Derecho Penal I',
        codigo: 'DER-301',
        semestre: 3,
        descripcion: 'Teoría del delito y derecho penal general'
      },
      {
        nombre: 'Derecho Constitucional',
        codigo: 'DER-401',
        semestre: 4,
        descripcion: 'Estructura del Estado y derechos fundamentales'
      },
      {
        nombre: 'Derecho Laboral',
        codigo: 'DER-501',
        semestre: 5,
        descripcion: 'Relaciones laborales y derecho del trabajo'
      },
      {
        nombre: 'Derecho Procesal',
        codigo: 'DER-601',
        semestre: 6,
        descripcion: 'Procedimientos judiciales y proceso civil'
      }
    ],
    'CON-PUB': [
      {
        nombre: 'Fundamentos de Contabilidad',
        codigo: 'CON-101',
        semestre: 1,
        descripcion: 'Principios contables y ciclo contable básico'
      },
      {
        nombre: 'Contabilidad Financiera',
        codigo: 'CON-201',
        semestre: 2,
        descripcion: 'Estados financieros y normas contables internacionales'
      },
      {
        nombre: 'Costos y Presupuestos',
        codigo: 'CON-301',
        semestre: 3,
        descripcion: 'Contabilidad de costos y elaboración de presupuestos'
      },
      {
        nombre: 'Auditoría I',
        codigo: 'CON-401',
        semestre: 4,
        descripcion: 'Fundamentos de auditoría y control interno'
      },
      {
        nombre: 'Tributación',
        codigo: 'CON-501',
        semestre: 5,
        descripcion: 'Sistema tributario y obligaciones fiscales'
      },
      {
        nombre: 'Revisoría Fiscal',
        codigo: 'CON-601',
        semestre: 6,
        descripcion: 'Funciones del revisor fiscal y dictamen contable'
      }
    ],
    'ING-IND': [
      {
        nombre: 'Introducción a la Ingeniería Industrial',
        codigo: 'IND-101',
        semestre: 1,
        descripcion: 'Fundamentos de la ingeniería industrial y sus aplicaciones'
      },
      {
        nombre: 'Estadística Industrial',
        codigo: 'IND-201',
        semestre: 2,
        descripcion: 'Métodos estadísticos aplicados a la industria'
      },
      {
        nombre: 'Estudio del Trabajo',
        codigo: 'IND-301',
        semestre: 3,
        descripcion: 'Análisis de métodos y medición del trabajo'
      },
      {
        nombre: 'Gestión de Producción',
        codigo: 'IND-401',
        semestre: 4,
        descripcion: 'Planificación y control de la producción industrial'
      },
      {
        nombre: 'Logística y Cadena de Suministro',
        codigo: 'IND-501',
        semestre: 5,
        descripcion: 'Gestión de la cadena de suministro y distribución'
      },
      {
        nombre: 'Gestión de Calidad',
        codigo: 'IND-601',
        semestre: 6,
        descripcion: 'Sistemas de gestión de calidad y mejora continua'
      }
    ]
  };

  let totalCreated = 0;

  // Crear materias para cada carrera
  for (const [careerCode, subjects] of Object.entries(subjectsData)) {
    const careerId = careerMap[careerCode];
    
    if (!careerId) {
      console.log(`  ⚠️  Carrera ${careerCode} no encontrada, omitiendo materias...`);
      continue;
    }

    console.log(`\n  📚 Procesando materias de ${careerCode}:`);

    for (const subject of subjects) {
      const existing = await prisma.subject.findUnique({
        where: { codigo: subject.codigo }
      });

      if (!existing) {
        await prisma.subject.create({
          data: {
            ...subject,
            careerId
          }
        });
        console.log(`    ✅ ${subject.nombre} (${subject.codigo})`);
        totalCreated++;
      } else {
        console.log(`    ⏭️  ${subject.nombre} ya existe`);
      }
    }
  }

  console.log(`\n✅ ${totalCreated} materias creadas en total\n`);
}

/**
 * Seed de Plantilla de Evaluación y Preguntas
 */
async function seedEvaluationTemplate() {
  console.log('🌱 Seeding evaluation template and questions...');

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
    console.log(`  ✅ Plantilla creada: ${template.nombre}`);
  } else {
    console.log(`  ⏭️  Plantilla ya existe: ${template.nombre}`);
  }

  // 2. Preguntas de evaluación
  const questions = [
    {
      categoria: 'Competencia Disciplinaria',
      aspecto: 'Formativo',
      nroPregunta: 1,
      enunciado: 'Demuestra dominio y actualización en la presentación de los temas del curso.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 1
    },
    {
      categoria: 'Conocimiento y dominio de la materia',
      aspecto: 'Formativo',
      nroPregunta: 2,
      enunciado: 'Orienta de manera clara los conceptos y teorias del curso.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 2
    },
    {
      categoria: 'Dominio de una segunda lengua',
      aspecto: 'Formativo',
      nroPregunta: 3,
      enunciado: 'Promueve el uso de textos u otros materiales en idioma extranjero.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 3
    },
    {
      categoria: 'Planeación y organización del trabajo pedagógico',
      aspecto: 'Destrezas para desarrollar el proceso de enseñanza y aprendizaje',
      nroPregunta: 4,
      enunciado: 'Presenta el plan de curso y explica su importancia para la formación profesional de los estudiantes.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 4
    },
    {
      categoria: 'Manejo de estrategias didácticas para el aprendizaje',
      aspecto: 'Destrezas para desarrollar el proceso de enseñanza y aprendizaje',
      nroPregunta: 5,
      enunciado: 'Explica con claridad las actividades y los aprendizajes que se pretenden alcanzar.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 5
    },
    {
      categoria: 'Gestión de TIC y Recursos para el aprendizaje',
      aspecto: 'Destrezas para desarrollar el proceso de enseñanza y aprendizaje',
      nroPregunta: 6,
      enunciado: 'Utiliza el aula virtual institucional para compartir recursos y materiales que complementan los procesos de enseñanza y aprendizaje.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 6
    },
    {
      categoria: 'Evaluación del aprendizaje',
      aspecto: 'Destrezas para desarrollar el proceso de enseñanza y aprendizaje',
      nroPregunta: 7,
      enunciado: 'Realiza evaluaciones coherentes con los contenidos desarrollados en clase y con los aprendizajes esperados.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 7
    },
    {
      categoria: 'Evaluación del aprendizaje',
      aspecto: 'Comunicación',
      nroPregunta: 8,
      enunciado: 'Escribe recomendaciones públicas y privadas en el aula virtual del curso a partir de los resultados de las evaluaciones para mejorar el proceso de aprendizaje.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 8
    },
    {
      categoria: 'Gestión del aprendizaje autónomo y autoregulado',
      aspecto: 'Destrezas para desarrollar el proceso de enseñanza y aprendizaje',
      nroPregunta: 9,
      enunciado: 'Propone actividades de aprendizaje fuera del aula orientadas a preparar o complementar los contenidos del curso.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 9
    },
    {
      categoria: 'Gestión de un clima favorable para el desarrollo del aprendizaje',
      aspecto: 'Comunicación',
      nroPregunta: 10,
      enunciado: 'Establece normas y acuerdos para que exista un clima de respeto mutuo.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 10
    },
    {
      categoria: 'Comunicación asertiva',
      aspecto: 'Comunicación',
      nroPregunta: 11,
      enunciado: 'Se expresa con claridad, coherencia y precisión.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 11
    },
    {
      categoria: 'Observancia de los principios institucionales',
      aspecto: 'Ético - Social',
      nroPregunta: 12,
      enunciado: 'Comienza y termina las clases a la hora prevista.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 12
    },
    {
      categoria: 'Respeto, buen trato, trabajo en Equipo',
      aspecto: 'Ético - Social',
      nroPregunta: 13,
      enunciado: 'Inspira respeto y confiabilidad en su desempeño docente.',
      tipoRespuesta: 'escala',
      valorMinimo: 1,
      valorMaximo: 5,
      orden: 13
    }
  ];

  let createdCount = 0;
  
  for (const question of questions) {
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
      console.log(`  ✅ Pregunta ${question.nroPregunta}: ${question.enunciado.substring(0, 50)}...`);
    } else {
      console.log(`  ⏭️  Pregunta ${question.nroPregunta} ya existe`);
    }
  }

  console.log(`\n✅ ${createdCount} preguntas creadas\n`);
}

/**
 * Función principal de seed
 */
async function main() {
  console.log('\n🚀 Iniciando seed de la base de datos...\n');

  try {
    // Seed de roles
    await seedRoles();
  
    // Seed de carreras
    await seedCareers();

    // Seed de materias
    await seedSubjects();

    // Seed de plantilla de evaluación
    await seedEvaluationTemplate();

    console.log('🎉 Seed completado exitosamente!\n');
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    throw error;
  }
}

// Ejecutar seed
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
