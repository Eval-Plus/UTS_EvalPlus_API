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
    // ============================================
    // 1. ADMINISTRACIÓN DE EMPRESAS - VIRTUAL
    // ============================================
    {
      nombre: 'Administración de Empresas - Virtual',
      codigo: 'ADM-EMP-VIRT',
      icon: 'business_center',
      color: '0xFF4CAF50',
      descripcion: 'Programa profesional orientado a la gestión empresarial, gerencia, planeación y toma de decisiones en organizaciones.'
    },

    // ============================================
    // 2. TECNOLOGÍA EN CONTABILIDAD FINANCIERA - VIRTUAL
    // ============================================
    {
      nombre: 'Tecnología en Contabilidad Financiera - Virtual',
      codigo: 'TCF-VIRT',
      icon: 'account_balance',
      color: '0xFF2E7D32',
      descripcion: 'Tecnología orientada a la contabilidad general, fiscalidad, costos, auditoría y control interno empresarial.'
    },

    // ============================================
    // 3. TECNOLOGÍA EN GESTIÓN COMERCIAL - VIRTUAL
    // ============================================
    {
      nombre: 'Tecnología en Gestión Comercial - Virtual',
      codigo: 'TGC-VIRT',
      icon: 'shopping_cart',
      color: '0xFF9C27B0',
      descripcion: 'Programa tecnológico enfocado en mercadeo, logística, procesos comerciales y desarrollo de estrategias comerciales.'
    },

    // ============================================
    // 4. TECNOLOGÍA EN GESTIÓN CONTABLE - VIRTUAL
    // ============================================
    {
      nombre: 'Tecnología en Gestión Contable - Virtual',
      codigo: 'TCONT-VIRT',
      icon: 'calculate',
      color: '0xFF3F51B5',
      descripcion: 'Tecnología que cubre legislación, contabilidad, tributaria, auditoría, estados financieros y procesos contables.'
    },

    // ============================================
    // 5. TECNOLOGÍA EN GESTIÓN EMPRESARIAL - VIRTUAL
    // ============================================
    {
      nombre: 'Tecnología en Gestión Empresarial - Virtual',
      codigo: 'TGEMP-VIRT',
      icon: 'apartment',
      color: '0xFF2196F3',
      descripcion: 'Tecnología orientada a procesos administrativos, planeación, desarrollo organizacional y gestión empresarial moderna.'
    },

    // ============================================
    // 6. PROFESIONAL EN MERCADEO - VIRTUAL
    // ============================================
    {
      nombre: 'Profesional en Mercadeo - Virtual',
      codigo: 'PMEV-2018-2',
      icon: 'campaign',
      color: '0xFFFF9800',
      descripcion: 'Programa profesional enfocado en estrategias de mercadeo, investigación de mercados, gerencia de marca, análisis financiero y gestión comercial estratégica.'
    },
    
    // ============================================
    // 7. CONTADURÍA PÚBLICA - VIRTUAL
    // ============================================
    {
      nombre: 'Contaduría Pública - Virtual',
      codigo: 'PCPV-2018-2',
      icon: 'receipt_long',
      color: '0xFF00BCD4',
      descripcion: 'Programa profesional orientado a la auditoría, gestión contable, tributación, ética profesional, planeación organizacional y negocios internacionales.'
    }
  ];

  const createdCareers = [];
  
  for (const career of careers) {
    const existing = await prisma.career.findUnique({
      where: { codigo: career.codigo }
    });

    if (!existing) {
      const created = await prisma.career.create({ data: career });
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
    'ADM-EMP-VIRT': [
      // Período 1
      {
        nombre: 'Álgebra Matricial',
        codigo: 'DCB028V',
        semestre: 1,
        descripcion: 'Fundamentos de álgebra lineal y matrices aplicados a la administración'
      },
      {
        nombre: 'Estadística Inferencial',
        codigo: 'DCB022V',
        semestre: 1,
        descripcion: 'Métodos estadísticos para análisis de datos y toma de decisiones empresariales'
      },
      {
        nombre: 'La Administración Estratégica',
        codigo: 'PAE102V',
        semestre: 1,
        descripcion: 'Fundamentos de planeación estratégica, dirección y control organizacional'
      },
      {
        nombre: 'Liderazgo Social y Empresarial',
        codigo: 'DHI022V',
        semestre: 1,
        descripcion: 'Desarrollo de habilidades de liderazgo y gestión de equipos en organizaciones'
      },
      {
        nombre: 'Propedéutica de la Administración',
        codigo: 'PAE101V',
        semestre: 1,
        descripcion: 'Introducción a los principios fundamentales de la administración empresarial'
      },
      
      // Período 2
      {
        nombre: 'Comunicación Organizacional',
        codigo: 'DHI005V',
        semestre: 2,
        descripcion: 'Estrategias de comunicación interna y externa en las organizaciones'
      },
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'PAE00RV',
        semestre: 2,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas de la administración'
      },
      {
        nombre: 'Negocios en su Contexto',
        codigo: 'PAE202V',
        semestre: 2,
        descripcion: 'Análisis del entorno empresarial, factores económicos, sociales y políticos'
      },
      {
        nombre: 'Programación Lineal',
        codigo: 'FCS015V',
        semestre: 2,
        descripcion: 'Técnicas de optimización y modelos matemáticos para la toma de decisiones'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00BV',
        semestre: 2,
        descripcion: 'Asignatura optativa para ampliar conocimientos en áreas complementarias'
      },
      
      // Período 3
      {
        nombre: 'Desarrollo de Proyectos',
        codigo: 'PAE303V',
        semestre: 3,
        descripcion: 'Formulación, evaluación y gestión de proyectos empresariales'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'PAE00TV',
        semestre: 3,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Herramientas Gerenciales de Control',
        codigo: 'PAE400V',
        semestre: 3,
        descripcion: 'Sistemas de control gerencial, indicadores y tableros de gestión'
      },
      {
        nombre: 'Investigación de Operaciones',
        codigo: 'FCS017V',
        semestre: 3,
        descripcion: 'Modelos cuantitativos avanzados para la optimización de recursos'
      },
      {
        nombre: 'Metodología para la Elaboración de Proyectos II',
        codigo: 'DHI018V',
        semestre: 3,
        descripcion: 'Metodologías avanzadas para el desarrollo de proyectos de investigación'
      },
      
      // Período 4
      {
        nombre: 'Desarrollo de la Organización',
        codigo: 'PAE404V',
        semestre: 4,
        descripcion: 'Gestión del cambio organizacional y desarrollo del talento humano'
      },
      {
        nombre: 'Electiva de Profundización III',
        codigo: 'PAE00SV',
        semestre: 4,
        descripcion: 'Tercera electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Electiva Optativa II',
        codigo: 'DHO00CV',
        semestre: 4,
        descripcion: 'Segunda asignatura optativa para complementar la formación profesional'
      },
      {
        nombre: 'Herramientas Gerenciales de Gestión',
        codigo: 'PAE500V',
        semestre: 4,
        descripcion: 'Herramientas modernas de gestión empresarial y dirección estratégica'
      },
      {
        nombre: 'Organizaciones en el Contexto Global',
        codigo: 'PAE405V',
        semestre: 4,
        descripcion: 'Gestión de empresas en mercados internacionales y globalización'
      }
    ],
    'TCF-VIRT': [
      // Período 1
      {
        nombre: 'Contabilidad General',
        codigo: 'FCS002V',
        semestre: 1,
        descripcion: 'Fundamentos de contabilidad, registro de transacciones y principios contables básicos'
      },
      {
        nombre: 'Identidad Uteista',
        codigo: 'DHI021V',
        semestre: 1,
        descripcion: 'Principios institucionales, valores y cultura organizacional de la UTE'
      },
      {
        nombre: 'Introducción a la Contaduría',
        codigo: 'TCF100V',
        semestre: 1,
        descripcion: 'Conceptos básicos de la profesión contable y su campo de acción'
      },
      {
        nombre: 'Matemática Básica',
        codigo: 'DCB025V',
        semestre: 1,
        descripcion: 'Fundamentos matemáticos aplicados a la contabilidad y finanzas'
      },
      {
        nombre: 'Módulo Integrador Fundamentos de la Organización',
        codigo: 'FCS024V',
        semestre: 1,
        descripcion: 'Integración de conocimientos sobre estructura y funcionamiento organizacional'
      },
      
      // Período 2
      {
        nombre: 'Cálculo',
        codigo: 'DCB035V',
        semestre: 2,
        descripcion: 'Conceptos de cálculo diferencial e integral aplicados a finanzas'
      },
      {
        nombre: 'Legislación Comercial',
        codigo: 'FCS013V',
        semestre: 2,
        descripcion: 'Marco legal del comercio, sociedades y obligaciones mercantiles'
      },
      {
        nombre: 'Microeconomía',
        codigo: 'TCF203V',
        semestre: 2,
        descripcion: 'Principios económicos, oferta, demanda y comportamiento del mercado'
      },
      {
        nombre: 'Módulo Integrador La Fiscalidad y los Activos',
        codigo: 'TCF207V',
        semestre: 2,
        descripcion: 'Gestión contable de activos y aspectos tributarios relacionados'
      },
      {
        nombre: 'Sistemas de Información',
        codigo: 'TCF202V',
        semestre: 2,
        descripcion: 'Sistemas informáticos aplicados a la gestión contable y financiera'
      },
      
      // Período 3
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'TCF00RV',
        semestre: 3,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas de contabilidad'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00AV',
        semestre: 3,
        descripcion: 'Asignatura optativa para ampliar conocimientos complementarios'
      },
      {
        nombre: 'Legislación Laboral',
        codigo: 'FCS014V',
        semestre: 3,
        descripcion: 'Marco legal del derecho laboral, contratos y seguridad social'
      },
      {
        nombre: 'Metodología de la Investigación',
        codigo: 'DHI004V',
        semestre: 3,
        descripcion: 'Métodos y técnicas de investigación científica aplicada'
      },
      {
        nombre: 'Módulo Integrador La Fiscalidad y los Pasivos',
        codigo: 'TCF307V',
        semestre: 3,
        descripcion: 'Gestión contable de pasivos y obligaciones tributarias'
      },
      
      // Período 4
      {
        nombre: 'Administración de la Producción',
        codigo: 'FCS009V',
        semestre: 4,
        descripcion: 'Gestión de procesos productivos, costos y optimización de recursos'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'TCF00SV',
        semestre: 4,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Módulo Integrador Contabilidad Producción y Mercadeo',
        codigo: 'TCF413V',
        semestre: 4,
        descripcion: 'Integración de contabilidad de costos, producción y estrategias comerciales'
      },
      
      // Período 5
      {
        nombre: 'Electiva de Profundización III',
        codigo: 'TCF00TV',
        semestre: 5,
        descripcion: 'Tercera electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Estadística',
        codigo: 'DCB004V',
        semestre: 5,
        descripcion: 'Métodos estadísticos descriptivos e inferenciales para análisis de datos'
      },
      {
        nombre: 'Metodología para la Elaboración de Proyectos I',
        codigo: 'DHI017V',
        semestre: 5,
        descripcion: 'Diseño y formulación de proyectos de investigación aplicada'
      },
      {
        nombre: 'Módulo Integrador Control y Análisis de la Información',
        codigo: 'TCF512V',
        semestre: 5,
        descripcion: 'Análisis financiero, auditoría y control de información contable'
      },
      
      // Período 6
      {
        nombre: 'Control Interno',
        codigo: 'TCF500V',
        semestre: 6,
        descripcion: 'Sistemas de control interno, gestión de riesgos y gobierno corporativo'
      },
      {
        nombre: 'Electiva de Profundización IV',
        codigo: 'TCF00UV',
        semestre: 6,
        descripcion: 'Cuarta electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Emprendimiento',
        codigo: 'FCS025V',
        semestre: 6,
        descripcion: 'Desarrollo de habilidades emprendedoras y creación de empresas'
      },
      {
        nombre: 'Estadística Inferencial',
        codigo: 'DCB022V',
        semestre: 6,
        descripcion: 'Inferencia estadística, pruebas de hipótesis y análisis predictivo'
      },
      {
        nombre: 'Módulo Integrador Laboratorio Empresarial',
        codigo: 'TCF612V',
        semestre: 6,
        descripcion: 'Práctica integral de gestión contable en entornos empresariales reales'
      },
      {
        nombre: 'Teoría Contable',
        codigo: 'TCF604V',
        semestre: 6,
        descripcion: 'Fundamentos teóricos, normas y principios de la contabilidad moderna'
      }
    ],
    'TGC-VIRT': [
      // Período 1
      {
        nombre: 'Identidad Uteista',
        codigo: 'DHI021V',
        semestre: 1,
        descripcion: 'Principios institucionales, valores y cultura organizacional de la UTE'
      },
      {
        nombre: 'Matemática Básica',
        codigo: 'DCB025V',
        semestre: 1,
        descripcion: 'Fundamentos matemáticos aplicados a la gestión comercial'
      },
      {
        nombre: 'Módulo Integrador Fundamentos de la Organización',
        codigo: 'FCS024V',
        semestre: 1,
        descripcion: 'Integración de conocimientos sobre estructura y funcionamiento organizacional'
      },
      {
        nombre: 'Introducción al Marketing',
        codigo: 'TMG101V',
        semestre: 1,
        descripcion: 'Conceptos básicos de mercadeo, estrategias y fundamentos comerciales'
      },
      
      // Período 2
      {
        nombre: 'Cálculo',
        codigo: 'DCB035V',
        semestre: 2,
        descripcion: 'Conceptos de cálculo diferencial e integral aplicados a negocios'
      },
      {
        nombre: 'Elementos para la Comunicación del Mercadeo',
        codigo: 'TMG205V',
        semestre: 2,
        descripcion: 'Estrategias de comunicación, publicidad y promoción comercial'
      },
      {
        nombre: 'Legislación Empresarial',
        codigo: 'FCS010V',
        semestre: 2,
        descripcion: 'Marco legal de las empresas, contratos y obligaciones comerciales'
      },
      {
        nombre: 'Procesos Administrativos',
        codigo: 'FCS006V',
        semestre: 2,
        descripcion: 'Planificación, organización, dirección y control en organizaciones'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00AV',
        semestre: 2,
        descripcion: 'Asignatura optativa para ampliar conocimientos complementarios'
      },
      
      // Período 3
      {
        nombre: 'Contabilidad General',
        codigo: 'FCS002V',
        semestre: 3,
        descripcion: 'Fundamentos de contabilidad y registro de operaciones comerciales'
      },
      {
        nombre: 'Comportamiento del Consumidor',
        codigo: 'TMG201V',
        semestre: 3,
        descripcion: 'Análisis psicológico y social del comportamiento de compra'
      },
      {
        nombre: 'Innovación y Desarrollo de Producto',
        codigo: 'TMG504V',
        semestre: 3,
        descripcion: 'Diseño, innovación y desarrollo de productos y servicios'
      },
      {
        nombre: 'Metodología de la Investigación',
        codigo: 'DHI004V',
        semestre: 3,
        descripcion: 'Métodos y técnicas de investigación científica aplicada'
      },
      {
        nombre: 'Módulo Integrador Gestión Investigativa para la Toma de Decisiones',
        codigo: 'TMG304V',
        semestre: 3,
        descripcion: 'Investigación de mercados y análisis para decisiones comerciales'
      },
      
      // Período 4
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'TMG00RV',
        semestre: 4,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas comerciales'
      },
      {
        nombre: 'Estrategia de Precio',
        codigo: 'TMG503V',
        semestre: 4,
        descripcion: 'Políticas de precios, fijación y estrategias competitivas'
      },
      {
        nombre: 'Tiempos y Movimientos Comerciales',
        codigo: 'TMG411V',
        semestre: 4,
        descripcion: 'Optimización de procesos comerciales y eficiencia operativa'
      },
      {
        nombre: 'Laboratorio de Diseño Publicitario',
        codigo: 'TMG404V',
        semestre: 4,
        descripcion: 'Diseño gráfico y desarrollo de material publicitario'
      },
      {
        nombre: 'Matemática Financiera',
        codigo: 'FCS023V',
        semestre: 4,
        descripcion: 'Cálculos financieros, tasas de interés y evaluación de inversiones'
      },
      {
        nombre: 'Ética',
        codigo: 'DHI003V',
        semestre: 4,
        descripcion: 'Principios éticos y responsabilidad social empresarial'
      },
      
      // Período 5
      {
        nombre: 'Metodología para la Elaboración de Proyectos I',
        codigo: 'DHI017V',
        semestre: 5,
        descripcion: 'Diseño y formulación de proyectos comerciales'
      },
      {
        nombre: 'Administración del Talento Humano',
        codigo: 'FCS005V',
        semestre: 5,
        descripcion: 'Gestión de personal, selección, capacitación y desarrollo'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'TMG00SV',
        semestre: 5,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Gestión Logística y Distribución',
        codigo: 'TMG301V',
        semestre: 5,
        descripcion: 'Cadena de suministro, distribución y gestión de inventarios'
      },
      {
        nombre: 'Exhibición Comercial',
        codigo: 'TMG507V',
        semestre: 5,
        descripcion: 'Técnicas de merchandising, exhibición y visual comercial'
      },
      
      // Período 6
      {
        nombre: 'Electiva de Profundización III',
        codigo: 'TMG00TV',
        semestre: 6,
        descripcion: 'Tercera electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Emprendimiento',
        codigo: 'FCS025V',
        semestre: 6,
        descripcion: 'Desarrollo de habilidades emprendedoras y creación de empresas'
      },
      {
        nombre: 'Fundamentos de Comercio Internacional',
        codigo: 'TMG601V',
        semestre: 6,
        descripcion: 'Bases del comercio exterior, importaciones y exportaciones'
      },
      {
        nombre: 'Fundamentos de Microeconomía',
        codigo: 'TMG600V',
        semestre: 6,
        descripcion: 'Principios microeconómicos, mercados y estructuras competitivas'
      },
      {
        nombre: 'Introducción a los Negocios Internacionales',
        codigo: 'TMG403V',
        semestre: 6,
        descripcion: 'Globalización, mercados internacionales y estrategias de expansión'
      },
      {
        nombre: 'Planeación y Desarrollo Empresarial',
        codigo: 'TMG606V',
        semestre: 6,
        descripcion: 'Planeación estratégica, desarrollo y crecimiento empresarial'
      }
    ],
    'TCONT-VIRT': [
      // Período 1
      {
        nombre: 'Administración General',
        codigo: 'FCS001V',
        semestre: 1,
        descripcion: 'Principios fundamentales de la administración y gestión empresarial'
      },
      {
        nombre: 'Economía y Empresa',
        codigo: 'FCS003V',
        semestre: 1,
        descripcion: 'Fundamentos económicos y su aplicación en el contexto empresarial'
      },
      {
        nombre: 'Fundamentos Integrales de Contabilidad',
        codigo: 'TGC100V',
        semestre: 1,
        descripcion: 'Bases de la contabilidad, ciclo contable y principios generales'
      },
      {
        nombre: 'Legislación Empresarial',
        codigo: 'FCS032V',
        semestre: 1,
        descripcion: 'Marco legal de las empresas, normatividad y obligaciones comerciales'
      },
      {
        nombre: 'Matemática I',
        codigo: 'DCB046V',
        semestre: 1,
        descripcion: 'Conceptos matemáticos fundamentales aplicados a la contabilidad'
      },
      {
        nombre: 'Procesos de Lectura y Escritura',
        codigo: 'DHI014V',
        semestre: 1,
        descripcion: 'Desarrollo de habilidades de comprensión lectora y redacción'
      },
      
      // Período 2
      {
        nombre: 'Ética',
        codigo: 'DHI033V',
        semestre: 2,
        descripcion: 'Principios éticos y responsabilidad profesional en la contaduría'
      },
      {
        nombre: 'Gestión de Activos con Enfoque Tributario',
        codigo: 'TGC200V',
        semestre: 2,
        descripcion: 'Administración contable de activos y sus implicaciones fiscales'
      },
      {
        nombre: 'Matemática Financiera',
        codigo: 'FCS033V',
        semestre: 2,
        descripcion: 'Cálculos financieros, interés, anualidades y evaluación de inversiones'
      },
      {
        nombre: 'Matemática II',
        codigo: 'DCB047V',
        semestre: 2,
        descripcion: 'Conceptos matemáticos avanzados para análisis financiero'
      },
      {
        nombre: 'Microeconomía y Macroeconomía',
        codigo: 'FCS034V',
        semestre: 2,
        descripcion: 'Principios micro y macroeconómicos aplicados a la gestión empresarial'
      },
      {
        nombre: 'Optativa I',
        codigo: 'DHO00EV',
        semestre: 2,
        descripcion: 'Asignatura optativa para complementar la formación profesional'
      },
      
      // Período 3
      {
        nombre: 'Costos',
        codigo: 'TGC302V',
        semestre: 3,
        descripcion: 'Sistemas de costos, costeo y análisis de rentabilidad'
      },
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'TGC00RV',
        semestre: 3,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas contables'
      },
      {
        nombre: 'Epistemología',
        codigo: 'DHI029V',
        semestre: 3,
        descripcion: 'Teoría del conocimiento y fundamentos de la investigación'
      },
      {
        nombre: 'Optativa II',
        codigo: 'DHO00FV',
        semestre: 3,
        descripcion: 'Segunda asignatura optativa para ampliar conocimientos'
      },
      {
        nombre: 'Pasivo, Fiscalidad y Cuentas Patrimoniales',
        codigo: 'TGC301V',
        semestre: 3,
        descripcion: 'Gestión contable de pasivos, patrimonio y aspectos tributarios'
      },
      {
        nombre: 'Teoría Contable',
        codigo: 'TGC300V',
        semestre: 3,
        descripcion: 'Fundamentos teóricos, normas y principios de contabilidad'
      },
      
      // Período 4
      {
        nombre: 'Administración de la Producción',
        codigo: 'FCS035V',
        semestre: 4,
        descripcion: 'Gestión de procesos productivos y optimización de recursos'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'TGC00SV',
        semestre: 4,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Estadística',
        codigo: 'DCB051V',
        semestre: 4,
        descripcion: 'Métodos estadísticos para análisis de datos financieros'
      },
      {
        nombre: 'Estados Financieros: Elaboración y Diagnóstico',
        codigo: 'TGC400V',
        semestre: 4,
        descripcion: 'Preparación, análisis e interpretación de estados financieros'
      },
      {
        nombre: 'Inglés I',
        codigo: 'DDI009V',
        semestre: 4,
        descripcion: 'Fundamentos del idioma inglés aplicado al ámbito profesional'
      },
      {
        nombre: 'Tributaria I',
        codigo: 'TGC402V',
        semestre: 4,
        descripcion: 'Sistema tributario colombiano, impuestos y obligaciones fiscales'
      },
      
      // Período 5
      {
        nombre: 'Análisis de Costos',
        codigo: 'TGC500V',
        semestre: 5,
        descripcion: 'Análisis avanzado de costos y toma de decisiones financieras'
      },
      {
        nombre: 'Gestión de Mercados',
        codigo: 'FCS036V',
        semestre: 5,
        descripcion: 'Estrategias comerciales y gestión de mercados'
      },
      {
        nombre: 'Inglés II',
        codigo: 'DDI010V',
        semestre: 5,
        descripcion: 'Nivel intermedio de inglés para contextos profesionales'
      },
      {
        nombre: 'Proceso Auditor',
        codigo: 'TGC502V',
        semestre: 5,
        descripcion: 'Fundamentos de auditoría, procedimientos y técnicas de revisión'
      },
      {
        nombre: 'Seminario de Grado I',
        codigo: 'TGC503V',
        semestre: 5,
        descripcion: 'Primera fase del proyecto de grado y trabajo de investigación'
      },
      {
        nombre: 'Tributaria II',
        codigo: 'TGC501V',
        semestre: 5,
        descripcion: 'Aspectos avanzados de tributación y planeación fiscal'
      },
      
      // Período 6
      {
        nombre: 'Control Interno',
        codigo: 'TGC601V',
        semestre: 6,
        descripcion: 'Sistemas de control interno, gestión de riesgos y auditoría'
      },
      {
        nombre: 'Fundamentos del Sector Público',
        codigo: 'TGC602V',
        semestre: 6,
        descripcion: 'Contabilidad pública, presupuesto y gestión en el sector estatal'
      },
      {
        nombre: 'La Contabilidad de las Empresas y los Sistemas de Información',
        codigo: 'TGC600V',
        semestre: 6,
        descripcion: 'Integración de sistemas contables y tecnología de información'
      },
      {
        nombre: 'Seminario de Grado II',
        codigo: 'TGC603V',
        semestre: 6,
        descripcion: 'Fase final del proyecto de grado y presentación de resultados'
      },
      {
        nombre: 'Tributaria III',
        codigo: 'TGC604V',
        semestre: 6,
        descripcion: 'Tributación especializada, casos complejos y auditoría fiscal'
      }
    ],
    'TGEMP-VIRT': [
      // Período 1
      {
        nombre: 'Contabilidad General',
        codigo: 'FCS002V',
        semestre: 1,
        descripcion: 'Fundamentos de contabilidad y registro de operaciones empresariales'
      },
      {
        nombre: 'Identidad Uteista',
        codigo: 'DHI021V',
        semestre: 1,
        descripcion: 'Principios institucionales, valores y cultura organizacional de la UTE'
      },
      {
        nombre: 'Matemática Básica',
        codigo: 'DCB025V',
        semestre: 1,
        descripcion: 'Fundamentos matemáticos aplicados a la gestión empresarial'
      },
      {
        nombre: 'Módulo Integrador Fundamentos de la Organización',
        codigo: 'FCS024V',
        semestre: 1,
        descripcion: 'Integración de conocimientos sobre estructura y funcionamiento organizacional'
      },
      {
        nombre: 'Introducción a la Administración',
        codigo: 'TGE100V',
        semestre: 1,
        descripcion: 'Conceptos básicos de administración y gestión empresarial'
      },
      
      // Período 2
      {
        nombre: 'Cálculo',
        codigo: 'DCB035V',
        semestre: 2,
        descripcion: 'Conceptos de cálculo diferencial e integral aplicados a negocios'
      },
      {
        nombre: 'El Marketing en la Empresa',
        codigo: 'TGE202V',
        semestre: 2,
        descripcion: 'Estrategias de mercadeo, publicidad y gestión comercial empresarial'
      },
      {
        nombre: 'Política Económica',
        codigo: 'TGE201V',
        semestre: 2,
        descripcion: 'Análisis de políticas económicas y su impacto en las organizaciones'
      },
      
      // Período 3
      {
        nombre: 'Desarrollo de Bienes y Servicios',
        codigo: 'TGE304V',
        semestre: 3,
        descripcion: 'Diseño, desarrollo e innovación de productos y servicios empresariales'
      },
      {
        nombre: 'Estados Financieros',
        codigo: 'TGE302V',
        semestre: 3,
        descripcion: 'Análisis e interpretación de estados financieros empresariales'
      },
      {
        nombre: 'Metodología de la Investigación',
        codigo: 'DHI004V',
        semestre: 3,
        descripcion: 'Métodos y técnicas de investigación científica aplicada'
      },
      {
        nombre: 'Planeación y Control',
        codigo: 'TGE301V',
        semestre: 3,
        descripcion: 'Procesos de planeación estratégica y sistemas de control empresarial'
      },
      
      // Período 4
      {
        nombre: 'Desarrollo Local',
        codigo: 'TGE403V',
        semestre: 4,
        descripcion: 'Estrategias de desarrollo económico y social en contextos locales'
      },
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'TGE00RV',
        semestre: 4,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas empresariales'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00AV',
        semestre: 4,
        descripcion: 'Asignatura optativa para ampliar conocimientos complementarios'
      },
      {
        nombre: 'Estrategias en las Organizaciones',
        codigo: 'TGE404V',
        semestre: 4,
        descripcion: 'Formulación e implementación de estrategias empresariales competitivas'
      },
      {
        nombre: 'Matemática Financiera',
        codigo: 'FCS023V',
        semestre: 4,
        descripcion: 'Cálculos financieros, tasas de interés y evaluación de inversiones'
      },
      
      // Período 5
      {
        nombre: 'Estadística',
        codigo: 'DCB004V',
        semestre: 5,
        descripcion: 'Métodos estadísticos para análisis de datos y toma de decisiones'
      },
      {
        nombre: 'Metodología para la Elaboración de Proyectos I',
        codigo: 'DHI017V',
        semestre: 5,
        descripcion: 'Diseño y formulación de proyectos empresariales'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'TGE00SV',
        semestre: 5,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Procesos Empresariales',
        codigo: 'TGE503V',
        semestre: 5,
        descripcion: 'Gestión y optimización de procesos en organizaciones empresariales'
      },
      
      // Período 6
      {
        nombre: 'Electiva de Profundización III',
        codigo: 'TGE00TV',
        semestre: 6,
        descripcion: 'Tercera electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Emprendimiento',
        codigo: 'FCS025V',
        semestre: 6,
        descripcion: 'Desarrollo de habilidades emprendedoras y creación de empresas'
      },
      {
        nombre: 'Ética',
        codigo: 'DHI003V',
        semestre: 6,
        descripcion: 'Principios éticos y responsabilidad social empresarial'
      },
      {
        nombre: 'Formulación y Evaluación de Proyectos',
        codigo: 'FCS008V',
        semestre: 6,
        descripcion: 'Evaluación técnica, financiera y social de proyectos de inversión'
      },
      {
        nombre: 'Gestiones Administrativas',
        codigo: 'TGE603V',
        semestre: 6,
        descripcion: 'Procesos administrativos modernos y gestión organizacional avanzada'
      },
      {
        nombre: 'Liderazgo de Proyectos',
        codigo: 'TGE604V',
        semestre: 6,
        descripcion: 'Liderazgo, dirección y gestión de equipos en proyectos empresariales'
      },
      {
        nombre: 'Negocios Internacionales',
        codigo: 'TGE502V',
        semestre: 6,
        descripcion: 'Globalización, comercio internacional y estrategias de expansión'
      }
    ],
    'PCPV-2018-2': [
      // Período 1
      {
        nombre: 'Álgebra Matricial',
        codigo: 'DCB028V',
        semestre: 1,
        descripcion: 'Fundamentos de álgebra lineal y matrices aplicados a la contaduría'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00BV',
        semestre: 1,
        descripcion: 'Asignatura optativa para ampliar conocimientos complementarios'
      },
      {
        nombre: 'La Gestión de las Organizaciones',
        codigo: 'PCP706V',
        semestre: 1,
        descripcion: 'Gestión administrativa, planeación y control en organizaciones'
      },
      {
        nombre: 'Liderazgo Social y Empresarial',
        codigo: 'DHI022V',
        semestre: 1,
        descripcion: 'Desarrollo de habilidades de liderazgo y gestión de equipos'
      },
      {
        nombre: 'Macroeconomía',
        codigo: 'PCP703V',
        semestre: 1,
        descripcion: 'Análisis macroeconómico, política fiscal y monetaria'
      },
      {
        nombre: 'Presupuestos',
        codigo: 'PCP702V',
        semestre: 1,
        descripcion: 'Elaboración, ejecución y control de presupuestos empresariales'
      },
      
      // Período 2
      {
        nombre: 'Auditoría y la Gestión de los Recursos',
        codigo: 'PCP808V',
        semestre: 2,
        descripcion: 'Principios de auditoría, control y gestión eficiente de recursos'
      },
      {
        nombre: 'Economía Colombiana',
        codigo: 'PAE201V',
        semestre: 2,
        descripcion: 'Análisis del contexto económico colombiano y políticas nacionales'
      },
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'PCP00AV',
        semestre: 2,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas contables'
      },
      {
        nombre: 'Ética Profesional',
        codigo: 'PCP806V',
        semestre: 2,
        descripcion: 'Principios éticos y deontología del contador público'
      },
      {
        nombre: 'Investigación Contable',
        codigo: 'PCP1001V',
        semestre: 2,
        descripcion: 'Metodologías de investigación aplicadas a la contabilidad'
      },
      
      // Período 3
      {
        nombre: 'Auditoría de Sistemas',
        codigo: 'PCP908V',
        semestre: 3,
        descripcion: 'Auditoría de sistemas de información y controles tecnológicos'
      },
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'PCP00BV',
        semestre: 3,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Electiva Optativa II',
        codigo: 'DHO00CV',
        semestre: 3,
        descripcion: 'Segunda asignatura optativa para complementar la formación'
      },
      {
        nombre: 'Metodología para la Elaboración de Proyectos II',
        codigo: 'DHI018V',
        semestre: 3,
        descripcion: 'Metodologías avanzadas para el desarrollo de proyectos de investigación'
      },
      {
        nombre: 'Planeación de las Organizaciones',
        codigo: 'PCP911V',
        semestre: 3,
        descripcion: 'Planeación estratégica, táctica y operativa en organizaciones'
      },
      
      // Período 4
      {
        nombre: 'Evaluación de Proyectos',
        codigo: 'PCP1002V',
        semestre: 4,
        descripcion: 'Evaluación técnica, financiera y económica de proyectos de inversión'
      },
      {
        nombre: 'La Administración Estatal y la Revisoría',
        codigo: 'PCP1005V',
        semestre: 4,
        descripcion: 'Gestión pública, control fiscal y revisoría fiscal en Colombia'
      },
      {
        nombre: 'Negocios Internacionales',
        codigo: 'PCP906V',
        semestre: 4,
        descripcion: 'Comercio internacional, finanzas globales y contabilidad internacional'
      },
      {
        nombre: 'Seminario de Tributaria',
        codigo: 'PCP1004V',
        semestre: 4,
        descripcion: 'Análisis avanzado del sistema tributario y casos complejos fiscales'
      }
    ],
    'PMEV-2018-2': [
      // Período 1
      {
        nombre: 'Análisis de Estados Financieros',
        codigo: 'PMN101V',
        semestre: 1,
        descripcion: 'Análisis e interpretación de estados financieros para decisiones de mercadeo'
      },
      {
        nombre: 'Estadística Inferencial',
        codigo: 'DCB022V',
        semestre: 1,
        descripcion: 'Métodos estadísticos inferenciales para investigación de mercados'
      },
      {
        nombre: 'Fundamentos de Macroeconomía',
        codigo: 'PMN102V',
        semestre: 1,
        descripcion: 'Principios macroeconómicos y su impacto en estrategias de mercadeo'
      },
      {
        nombre: 'Liderazgo Social y Empresarial',
        codigo: 'DHI022V',
        semestre: 1,
        descripcion: 'Desarrollo de habilidades de liderazgo y gestión de equipos comerciales'
      },
      {
        nombre: 'Mediciones de Mercadeo',
        codigo: 'PMN105V',
        semestre: 1,
        descripcion: 'Métricas, KPIs y análisis de desempeño en estrategias de mercadeo'
      },
      
      // Período 2
      {
        nombre: 'Electiva de Profundización I',
        codigo: 'PMN00AV',
        semestre: 2,
        descripcion: 'Asignatura electiva para profundizar en áreas específicas de mercadeo'
      },
      {
        nombre: 'Evaluación de Proyectos',
        codigo: 'PMN201V',
        semestre: 2,
        descripcion: 'Evaluación financiera y económica de proyectos de mercadeo'
      },
      {
        nombre: 'Gerencia Estratégica Relacional',
        codigo: 'PMN207V',
        semestre: 2,
        descripcion: 'CRM, marketing relacional y gestión de relaciones con clientes'
      },
      {
        nombre: 'Investigación de Mercados Cuantitativas',
        codigo: 'PMN203V',
        semestre: 2,
        descripcion: 'Métodos cuantitativos para investigación y análisis de mercados'
      },
      {
        nombre: 'Investigación de Operaciones',
        codigo: 'FCS017V',
        semestre: 2,
        descripcion: 'Modelos cuantitativos para optimización de decisiones comerciales'
      },
      
      // Período 3
      {
        nombre: 'Electiva de Profundización II',
        codigo: 'PMN00BV',
        semestre: 3,
        descripcion: 'Segunda electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Electiva Optativa I',
        codigo: 'DHO00BV',
        semestre: 3,
        descripcion: 'Asignatura optativa para ampliar conocimientos complementarios'
      },
      {
        nombre: 'Gerencia y Construcción de Marca',
        codigo: 'PMN303V',
        semestre: 3,
        descripcion: 'Branding, posicionamiento y gestión estratégica de marcas'
      },
      {
        nombre: 'Gestión de Calidad',
        codigo: 'PMN306V',
        semestre: 3,
        descripcion: 'Sistemas de gestión de calidad y mejora continua en mercadeo'
      },
      {
        nombre: 'Metodología para la Elaboración de Proyectos II',
        codigo: 'DHI018V',
        semestre: 3,
        descripcion: 'Metodologías avanzadas para proyectos de investigación en mercadeo'
      },
      
      // Período 4
      {
        nombre: 'Electiva de Profundización III',
        codigo: 'PMN00DV',
        semestre: 4,
        descripcion: 'Tercera electiva de profundización en áreas especializadas'
      },
      {
        nombre: 'Electiva Optativa II',
        codigo: 'DHO00CV',
        semestre: 4,
        descripcion: 'Segunda asignatura optativa para complementar la formación profesional'
      },
      {
        nombre: 'Gerencia Estratégica Comercial',
        codigo: 'PMN406V',
        semestre: 4,
        descripcion: 'Estrategias comerciales, ventas y dirección de equipos comerciales'
      },
      {
        nombre: 'Marketing Internacional',
        codigo: 'FCS021V',
        semestre: 4,
        descripcion: 'Mercadeo global, estrategias internacionales y comercio exterior'
      },
      {
        nombre: 'Simulación de Negocios',
        codigo: 'PMN407V',
        semestre: 4,
        descripcion: 'Simuladores empresariales y toma de decisiones estratégicas de mercadeo'
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
