import prisma from '../config/prisma.js';

class CareerModel {
  /**
   * Obtener todas las carreras activas
   */
  static async findAll() {
    return await prisma.career.findMany({
      where: {
        activo: true
      },
      orderBy: {
        nombre: 'asc'
      }
    });
  }

  /**
   * Obtener una carrera por ID
   */
  static async findById(id) {
    return await prisma.career.findUnique({
      where: { id: parseInt(id) },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true
              }
            }
          }
        }
      }
    });
  }

  /**
   * Obtener una carrera por código
   */
  static async findByCode(codigo) {
    return await prisma.career.findUnique({
      where: { codigo }
    });
  }

  /**
   * Crear una nueva carrera
   */
  static async create(data) {
    return await prisma.career.create({
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        icon: data.icon || 'school',
        color: data.color || '0xFF135D66',
        descripcion: data.descripcion,
        activo: data.activo ?? true
      }
    });
  }

  /**
   * Actualizar una carrera
   */
  static async update(id, data) {
    return await prisma.career.update({
      where: { id: parseInt(id) },
      data: {
        nombre: data.nombre,
        codigo: data.codigo,
        icon: data.icon,
        color: data.color,
        descripcion: data.descripcion,
        activo: data.activo
      }
    });
  }

  /**
   * Eliminar (desactivar) una carrera
   */
  static async delete(id) {
    return await prisma.career.update({
      where: { id: parseInt(id) },
      data: { activo: false }
    });
  }

  /**
   * Obtener estudiantes de una carrera
   */
  static async getStudents(careerId) {
    const career = await prisma.career.findUnique({
      where: { id: parseInt(careerId) },
      include: {
        students: {
          include: {
            student: {
              select: {
                id: true,
                nombreCompleto: true,
                email: true,
                identificacion: true,
                profilePicture: true
              }
            }
          }
        }
      }
    });

    return career?.students.map(sc => ({
      ...sc.student,
      enrolledAt: sc.enrolledAt
    })) || [];
  }

  /**
   * Inscribir un estudiante en una carrera
   */
  static async enrollStudent(studentId, careerId) {
    return await prisma.studentCareer.create({
      data: {
        studentId: parseInt(studentId),
        careerId: parseInt(careerId)
      },
      include: {
        student: true,
        career: true
      }
    });
  }

  /**
   * Desinscribir un estudiante de una carrera
   */
  static async unenrollStudent(studentId, careerId) {
    return await prisma.studentCareer.deleteMany({
      where: {
        studentId: parseInt(studentId),
        careerId: parseInt(careerId)
      }
    });
  }

  /**
   * Seed inicial - Crear carreras de prueba
   */
  static async seedCareers() {
    const careers = [
      {
        nombre: 'Ingeniería de Sistemas',
        codigo: 'ING-SIS',
        icon: 'computer',
        color: '0xFFA8B820',
        descripcion: 'Carrera enfocada en el desarrollo de software y sistemas informáticos'
      },
      {
        nombre: 'Administración de Empresas',
        codigo: 'ADM-EMP',
        icon: 'business_center',
        color: '0xFFA8B820',
        descripcion: 'Formación integral en gestión empresarial y administrativa'
      },
      {
        nombre: 'Derecho',
        codigo: 'DER',
        icon: 'gavel',
        color: '0xFFA8B820',
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
      const existing = await this.findByCode(career.codigo);
      if (!existing) {
        const created = await this.create(career);
        createdCareers.push(created);
      }
    }

    return createdCareers;
  }
}

export default CareerModel;
