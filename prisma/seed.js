import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
        professorName: 'Dr. Roberto Silva',
        semestre: 1,
        descripcion: 'Introducción a los conceptos básicos de programación y algoritmos'
      },
      {
        nombre: 'Estructuras de Datos',
        codigo: 'SIS-201',
        professorName: 'Ing. Carlos Rodríguez',
        semestre: 2,
        descripcion: 'Estudio de estructuras de datos fundamentales: listas, pilas, colas, árboles'
      },
      {
        nombre: 'Programación Orientada a Objetos',
        codigo: 'SIS-301',
        professorName: 'Dr. Juan Pérez',
        semestre: 3,
        descripcion: 'Paradigma de programación orientada a objetos con Java y Python'
      },
      {
        nombre: 'Bases de Datos',
        codigo: 'SIS-401',
        professorName: 'Dra. María García',
        semestre: 4,
        descripcion: 'Diseño, implementación y gestión de bases de datos relacionales'
      },
      {
        nombre: 'Desarrollo Web',
        codigo: 'SIS-501',
        professorName: 'Ing. Ana Martínez',
        semestre: 5,
        descripcion: 'Desarrollo de aplicaciones web con HTML, CSS, JavaScript y frameworks modernos'
      },
      {
        nombre: 'Ingeniería de Software',
        codigo: 'SIS-601',
        professorName: 'Dr. Luis Fernández',
        semestre: 6,
        descripcion: 'Metodologías ágiles, arquitectura de software y gestión de proyectos'
      }
    ],
    'ADM-EMP': [
      {
        nombre: 'Introducción a la Administración',
        codigo: 'ADM-101',
        professorName: 'Dr. Fernando López',
        semestre: 1,
        descripcion: 'Conceptos fundamentales de la administración empresarial'
      },
      {
        nombre: 'Contabilidad General',
        codigo: 'ADM-201',
        professorName: 'Dra. Patricia Morales',
        semestre: 2,
        descripcion: 'Principios básicos de contabilidad y estados financieros'
      },
      {
        nombre: 'Marketing Estratégico',
        codigo: 'ADM-301',
        professorName: 'Ing. Roberto Sánchez',
        semestre: 3,
        descripcion: 'Estrategias de marketing y comportamiento del consumidor'
      },
      {
        nombre: 'Gestión de Recursos Humanos',
        codigo: 'ADM-401',
        professorName: 'Dra. Carmen Díaz',
        semestre: 4,
        descripcion: 'Administración del talento humano en las organizaciones'
      },
      {
        nombre: 'Finanzas Corporativas',
        codigo: 'ADM-501',
        professorName: 'Dr. Miguel Torres',
        semestre: 5,
        descripcion: 'Análisis financiero y decisiones de inversión empresarial'
      },
      {
        nombre: 'Dirección Estratégica',
        codigo: 'ADM-601',
        professorName: 'Dr. Alberto Ramírez',
        semestre: 6,
        descripcion: 'Planeación estratégica y toma de decisiones gerenciales'
      }
    ],
    'DER': [
      {
        nombre: 'Introducción al Derecho',
        codigo: 'DER-101',
        professorName: 'Dr. Jaime Castro',
        semestre: 1,
        descripcion: 'Fundamentos del derecho y sistemas jurídicos'
      },
      {
        nombre: 'Derecho Civil I',
        codigo: 'DER-201',
        professorName: 'Dra. Lucía Vargas',
        semestre: 2,
        descripcion: 'Personas, familia y obligaciones civiles'
      },
      {
        nombre: 'Derecho Penal I',
        codigo: 'DER-301',
        professorName: 'Dr. Ricardo Mendoza',
        semestre: 3,
        descripcion: 'Teoría del delito y derecho penal general'
      },
      {
        nombre: 'Derecho Constitucional',
        codigo: 'DER-401',
        professorName: 'Dra. Sandra Romero',
        semestre: 4,
        descripcion: 'Estructura del Estado y derechos fundamentales'
      },
      {
        nombre: 'Derecho Laboral',
        codigo: 'DER-501',
        professorName: 'Dr. Eduardo Núñez',
        semestre: 5,
        descripcion: 'Relaciones laborales y derecho del trabajo'
      },
      {
        nombre: 'Derecho Procesal',
        codigo: 'DER-601',
        professorName: 'Dr. Mauricio Herrera',
        semestre: 6,
        descripcion: 'Procedimientos judiciales y proceso civil'
      }
    ],
    'CON-PUB': [
      {
        nombre: 'Fundamentos de Contabilidad',
        codigo: 'CON-101',
        professorName: 'Dra. Gloria Méndez',
        semestre: 1,
        descripcion: 'Principios contables y ciclo contable básico'
      },
      {
        nombre: 'Contabilidad Financiera',
        codigo: 'CON-201',
        professorName: 'Dr. Sergio Gutiérrez',
        semestre: 2,
        descripcion: 'Estados financieros y normas contables internacionales'
      },
      {
        nombre: 'Costos y Presupuestos',
        codigo: 'CON-301',
        professorName: 'Ing. Martha Salazar',
        semestre: 3,
        descripcion: 'Contabilidad de costos y elaboración de presupuestos'
      },
      {
        nombre: 'Auditoría I',
        codigo: 'CON-401',
        professorName: 'Dr. Carlos Peña',
        semestre: 4,
        descripcion: 'Fundamentos de auditoría y control interno'
      },
      {
        nombre: 'Tributación',
        codigo: 'CON-501',
        professorName: 'Dra. Diana Rojas',
        semestre: 5,
        descripcion: 'Sistema tributario y obligaciones fiscales'
      },
      {
        nombre: 'Revisoría Fiscal',
        codigo: 'CON-601',
        professorName: 'Dr. Andrés Jiménez',
        semestre: 6,
        descripcion: 'Funciones del revisor fiscal y dictamen contable'
      }
    ],
    'ING-IND': [
      {
        nombre: 'Introducción a la Ingeniería Industrial',
        codigo: 'IND-101',
        professorName: 'Ing. Jorge Acosta',
        semestre: 1,
        descripcion: 'Fundamentos de la ingeniería industrial y sus aplicaciones'
      },
      {
        nombre: 'Estadística Industrial',
        codigo: 'IND-201',
        professorName: 'Dra. Sofía Paredes',
        semestre: 2,
        descripcion: 'Métodos estadísticos aplicados a la industria'
      },
      {
        nombre: 'Estudio del Trabajo',
        codigo: 'IND-301',
        professorName: 'Ing. Daniel Ortiz',
        semestre: 3,
        descripcion: 'Análisis de métodos y medición del trabajo'
      },
      {
        nombre: 'Gestión de Producción',
        codigo: 'IND-401',
        professorName: 'Dr. Felipe Chávez',
        semestre: 4,
        descripcion: 'Planificación y control de la producción industrial'
      },
      {
        nombre: 'Logística y Cadena de Suministro',
        codigo: 'IND-501',
        professorName: 'Ing. Laura Vega',
        semestre: 5,
        descripcion: 'Gestión de la cadena de suministro y distribución'
      },
      {
        nombre: 'Gestión de Calidad',
        codigo: 'IND-601',
        professorName: 'Dr. Héctor Maldonado',
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
 * Función principal de seed
 */
async function main() {
  console.log('\n🚀 Iniciando seed de la base de datos...\n');

  try {
    // Seed de carreras primero
    await seedCareers();

    // Luego seed de materias
    await seedSubjects();

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
