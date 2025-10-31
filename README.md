# 🎓 Eval+ API

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-18.x-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15.x-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![AWS](https://img.shields.io/badge/AWS-EC2-FF9900?style=for-the-badge&logo=amazon-aws&logoColor=white)
![Nginx](https://img.shields.io/badge/Nginx-009639?style=for-the-badge&logo=nginx&logoColor=white)

**API RESTful para el Sistema de Evaluación Docente de las Unidades Tecnológicas de Santander**

[Documentación](#-documentación) • [Instalación](#-instalación) • [Uso](#-uso) • [Despliegue](#-despliegue)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción](#-descripción)
- [Características](#-características)
- [Arquitectura](#-arquitectura)
- [Tecnologías](#-tecnologías)
- [Requisitos Previos](#-requisitos-previos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Uso](#-uso)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [API Endpoints](#-api-endpoints)
- [Despliegue en AWS](#-despliegue-en-aws)
- [Mantenimiento](#-mantenimiento)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Descripción

**Eval+** es una API RESTful robusta y escalable desarrollada para modernizar el proceso de evaluación docente en las **Unidades Tecnológicas de Santander (UTS)**. Esta API sirve como backend para la aplicación móvil desarrollada en Flutter, permitiendo a los estudiantes Uteístas evaluar a sus docentes de manera eficiente, segura y transparente.

### Objetivos del Sistema

- ✅ Digitalizar el proceso de evaluación docente
- ✅ Garantizar la privacidad y anonimato de las evaluaciones
- ✅ Proporcionar datos en tiempo real para análisis institucional
- ✅ Mejorar la experiencia del usuario mediante una interfaz móvil moderna
- ✅ Facilitar la toma de decisiones basada en datos

---

## ✨ Características

### Funcionalidades Principales

- 🔐 **Autenticación y Autorización**: Sistema JWT para gestión segura de sesiones
- 📊 **Gestión de Evaluaciones**: CRUD completo para evaluaciones docentes
- 👥 **Gestión de Usuarios**: Estudiantes, docentes y administradores
- 📈 **Reportes y Analíticas**: Generación de estadísticas y métricas
- 🔔 **Notificaciones**: Sistema de alertas y recordatorios
- 📱 **API RESTful**: Endpoints optimizados para consumo móvil
- 🛡️ **Seguridad**: Validación de datos, rate limiting y protección CORS
- 📝 **Logging**: Sistema de auditoría y trazabilidad

### Características Técnicas

- ⚡ **Alto Rendimiento**: Optimizado para respuestas rápidas
- 🔄 **Escalabilidad**: Arquitectura preparada para crecimiento
- 🌐 **API Versionada**: Soporte para múltiples versiones de API
- 📦 **Modular**: Código organizado y mantenible
- 🧪 **Testeable**: Preparado para pruebas unitarias e integración
- 📚 **Documentado**: Código autodocumentado y endpoints descritos

---

## 🏗️ Arquitectura

```
┌─────────────────┐
│  Flutter App    │  (Cliente Móvil)
│  Eval+ Mobile   │
└────────┬────────┘
         │ HTTPS
         ▼
┌─────────────────┐
│  Cloudflare     │  (DNS + Proxy)
│  emprenet.work  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Nginx          │  (Reverse Proxy + SSL)
│  evalplus-api   │
│  .emprenet.work │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PM2            │  (Process Manager)
│  Node.js        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Express.js     │  (API REST)
│  Eval+ API      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PostgreSQL     │  (Base de Datos)
│  AWS RDS        │
└─────────────────┘
```

---

## 🛠️ Tecnologías

### Backend Core

| Tecnología | Versión | Propósito |
|-----------|---------|-----------|
| **Node.js** | 18.x | Runtime de JavaScript |
| **Express.js** | 4.x | Framework web minimalista |
| **PostgreSQL** | 15.x | Base de datos relacional |
| **Knex.js** | 3.x | Query Builder y Migraciones |

### Seguridad y Middleware

| Paquete | Propósito |
|---------|-----------|
| **helmet** | Seguridad HTTP headers |
| **cors** | Control de acceso CORS |
| **dotenv** | Variables de entorno |
| **bcrypt** | Encriptación de contraseñas |
| **jsonwebtoken** | Autenticación JWT |
| **express-validator** | Validación de datos |
| **express-rate-limit** | Limitación de peticiones |

### Utilidades

| Paquete | Propósito |
|---------|-----------|
| **morgan** | Logging HTTP |
| **winston** | Sistema de logs avanzado |
| **moment** | Manejo de fechas |
| **uuid** | Generación de identificadores únicos |

### Infraestructura

| Servicio | Propósito |
|----------|-----------|
| **AWS EC2** | Hosting del servidor |
| **AWS RDS** | Base de datos PostgreSQL |
| **Nginx** | Reverse proxy y SSL |
| **PM2** | Gestor de procesos Node.js |
| **Certbot** | Certificados SSL gratuitos |
| **Cloudflare** | DNS y CDN |

---

## 📦 Requisitos Previos

### Software Requerido

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 o **yarn** >= 1.22.0
- **PostgreSQL** >= 15.0
- **Git** >= 2.30.0

### Accesos Necesarios

- Cuenta AWS con acceso a EC2 y RDS
- Dominio configurado (emprenet.work)
- Acceso SSH a servidor Ubuntu
- Cuenta GitHub para repositorio

---

## 🚀 Instalación

### 1. Clonar el Repositorio

```bash
# Vía SSH (recomendado)
git clone git@github.com:Eval-Plus/UTS_EvalPlus_API.git

# O vía HTTPS
git clone https://github.com/Eval-Plus/UTS_EvalPlus_API.git

# Entrar al directorio
cd UTS_EvalPlus_API
```

### 2. Instalar Dependencias

```bash
# Instalar paquetes de producción
npm install

# O con yarn
yarn install
```

### 3. Configurar Variables de Entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar variables
nano .env
```

**Variables requeridas:**

```env
# Server
NODE_ENV=production
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evalplus_db
DB_USER=evalplus_user
DB_PASSWORD=your_secure_password

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d

# CORS
ALLOWED_ORIGINS=https://evalplus.emprenet.work

# App
API_VERSION=v1
```

### 4. Configurar Base de Datos

```bash
# Crear base de datos
createdb evalplus_db

# Ejecutar migraciones
npm run migrate:latest

# Ejecutar seeds (datos iniciales)
npm run seed:run
```

### 5. Iniciar en Desarrollo

```bash
# Modo desarrollo con auto-reload
npm run dev

# Verificar funcionamiento
curl http://localhost:3001/health
```

---

## ⚙️ Configuración

### Estructura de Variables de Entorno

El archivo `.env` contiene todas las configuraciones sensibles:

```env
# ========================
# Servidor
# ========================
NODE_ENV=production        # development | production | test
PORT=3001                  # Puerto de la aplicación
HOST=0.0.0.0              # Host de escucha

# ========================
# Base de Datos
# ========================
DB_HOST=localhost
DB_PORT=5432
DB_NAME=evalplus_db
DB_USER=evalplus_user
DB_PASSWORD=SecurePassword123!

# Pool de conexiones
DB_POOL_MIN=2
DB_POOL_MAX=10

# ========================
# Autenticación
# ========================
JWT_SECRET=your_super_secret_jwt_key_min_32_chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# ========================
# CORS
# ========================
ALLOWED_ORIGINS=https://evalplus.emprenet.work,https://admin.evalplus.emprenet.work

# ========================
# Rate Limiting
# ========================
RATE_LIMIT_WINDOW_MS=900000  # 15 minutos
RATE_LIMIT_MAX_REQUESTS=100  # 100 peticiones por ventana

# ========================
# Logging
# ========================
LOG_LEVEL=info  # error | warn | info | debug
LOG_FILE=logs/app.log

# ========================
# Email (Opcional)
# ========================
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@evalplus.com
SMTP_PASS=app_password_here

# ========================
# AWS (Opcional)
# ========================
AWS_REGION=us-east-2
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=evalplus-assets
```

---

## 💻 Uso

### Scripts Disponibles

```bash
# Desarrollo
npm run dev              # Inicia servidor con nodemon (auto-reload)

# Producción
npm start                # Inicia servidor en modo producción

# Base de Datos
npm run migrate:make     # Crear nueva migración
npm run migrate:latest   # Ejecutar migraciones pendientes
npm run migrate:rollback # Revertir última migración
npm run seed:make        # Crear nuevo seed
npm run seed:run         # Ejecutar seeds

# Testing (cuando se implemente)
npm test                 # Ejecutar tests
npm run test:watch       # Tests en modo watch
npm run test:coverage    # Cobertura de tests

# Linting (cuando se implemente)
npm run lint             # Verificar código
npm run lint:fix         # Corregir errores automáticamente
```

### Comandos PM2 (Producción)

```bash
# Iniciar aplicación
pm2 start src/server.js --name evalplus-api

# Ver estado
pm2 status

# Ver logs en tiempo real
pm2 logs evalplus-api

# Reiniciar aplicación
pm2 restart evalplus-api

# Detener aplicación
pm2 stop evalplus-api

# Eliminar de PM2
pm2 delete evalplus-api

# Monitoreo
pm2 monit

# Guardar configuración
pm2 save
```

---

## 📁 Estructura del Proyecto

```
UTS_EvalPlus_API/
│
├── src/                          # Código fuente
│   ├── config/                   # Configuraciones
│   │   ├── database.js           # Config de base de datos
│   │   ├── jwt.js                # Config de JWT
│   │   └── cors.js               # Config de CORS
│   │
│   ├── controllers/              # Controladores
│   │   ├── auth.controller.js    # Autenticación
│   │   ├── user.controller.js    # Usuarios
│   │   ├── teacher.controller.js # Docentes
│   │   └── evaluation.controller.js # Evaluaciones
│   │
│   ├── middlewares/              # Middlewares
│   │   ├── auth.middleware.js    # Verificación JWT
│   │   ├── validation.middleware.js # Validación de datos
│   │   ├── error.middleware.js   # Manejo de errores
│   │   └── rateLimit.middleware.js # Rate limiting
│   │
│   ├── models/                   # Modelos de datos
│   │   ├── User.js               # Modelo de Usuario
│   │   ├── Teacher.js            # Modelo de Docente
│   │   ├── Evaluation.js         # Modelo de Evaluación
│   │   └── Question.js           # Modelo de Pregunta
│   │
│   ├── routes/                   # Rutas de la API
│   │   ├── index.js              # Router principal
│   │   ├── auth.routes.js        # Rutas de autenticación
│   │   ├── user.routes.js        # Rutas de usuarios
│   │   ├── teacher.routes.js     # Rutas de docentes
│   │   └── evaluation.routes.js # Rutas de evaluaciones
│   │
│   ├── services/                 # Lógica de negocio
│   │   ├── auth.service.js       # Servicios de autenticación
│   │   ├── email.service.js      # Servicios de email
│   │   └── report.service.js     # Servicios de reportes
│   │
│   ├── utils/                    # Utilidades
│   │   ├── logger.js             # Sistema de logs
│   │   ├── validator.js          # Validadores personalizados
│   │   └── helpers.js            # Funciones auxiliares
│   │
│   ├── database/                 # Base de datos
│   │   ├── migrations/           # Migraciones
│   │   └── seeds/                # Seeds (datos iniciales)
│   │
│   ├── app.js                    # Configuración de Express
│   └── server.js                 # Punto de entrada
│
├── logs/                         # Logs de la aplicación
├── tests/                        # Tests (a implementar)
│   ├── unit/                     # Tests unitarios
│   └── integration/              # Tests de integración
│
├── .env                          # Variables de entorno (no versionado)
├── .env.example                  # Ejemplo de variables
├── .gitignore                    # Archivos ignorados por Git
├── knexfile.js                   # Configuración de Knex
├── package.json                  # Dependencias y scripts
├── package-lock.json             # Lock de dependencias
└── README.md                     # Este archivo
```

---

## 🌐 API Endpoints

### Base URL

```
Producción: https://evalplus-api.emprenet.work/api/v1
Desarrollo: http://localhost:3001/api/v1
```

### Endpoints Principales

#### Autenticación

```http
POST   /api/v1/auth/login           # Iniciar sesión
POST   /api/v1/auth/register         # Registro de usuario
POST   /api/v1/auth/refresh          # Refrescar token
POST   /api/v1/auth/logout           # Cerrar sesión
POST   /api/v1/auth/forgot-password  # Recuperar contraseña
POST   /api/v1/auth/reset-password   # Resetear contraseña
```

#### Usuarios

```http
GET    /api/v1/users                 # Listar usuarios (admin)
GET    /api/v1/users/:id             # Obtener usuario
PUT    /api/v1/users/:id             # Actualizar usuario
DELETE /api/v1/users/:id             # Eliminar usuario
GET    /api/v1/users/me              # Perfil del usuario actual
```

#### Docentes

```http
GET    /api/v1/teachers              # Listar docentes
GET    /api/v1/teachers/:id          # Obtener docente
POST   /api/v1/teachers              # Crear docente (admin)
PUT    /api/v1/teachers/:id          # Actualizar docente (admin)
DELETE /api/v1/teachers/:id          # Eliminar docente (admin)
GET    /api/v1/teachers/:id/evaluations # Evaluaciones del docente
```

#### Evaluaciones

```http
GET    /api/v1/evaluations           # Listar evaluaciones
GET    /api/v1/evaluations/:id       # Obtener evaluación
POST   /api/v1/evaluations           # Crear evaluación
PUT    /api/v1/evaluations/:id       # Actualizar evaluación
DELETE /api/v1/evaluations/:id       # Eliminar evaluación
POST   /api/v1/evaluations/:id/submit # Enviar evaluación
GET    /api/v1/evaluations/stats     # Estadísticas generales
```

#### Health Check

```http
GET    /health                       # Estado del servidor
GET    /api/v1/ping                  # Ping de la API
```

### Ejemplo de Request/Response

**Request:**
```bash
curl -X POST https://evalplus-api.emprenet.work/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "estudiante@uts.edu.co",
    "password": "password123"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "email": "estudiante@uts.edu.co",
      "name": "Juan Pérez",
      "role": "student"
    }
  }
}
```

---

## ☁️ Despliegue en AWS

### Arquitectura de Despliegue

```
Internet
   ↓
Cloudflare (DNS + CDN)
   ↓
AWS EC2 (Ubuntu 22.04)
   ├── Nginx (Reverse Proxy + SSL)
   ├── PM2 (Process Manager)
   ├── Node.js (Runtime)
   └── Eval+ API
       ↓
AWS RDS (PostgreSQL)
```

### Paso a Paso del Despliegue

#### 1. Preparar Instancia EC2

```bash
# Conectar a la instancia
ssh ubuntu@3.141.188.154

# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2

# Instalar Nginx
sudo apt install -y nginx

# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx
```

#### 2. Clonar y Configurar Proyecto

```bash
# Clonar repositorio
cd ~
git clone git@github.com:Eval-Plus/UTS_EvalPlus_API.git evalplus-api
cd evalplus-api

# Instalar dependencias
npm install --production

# Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción
```

#### 3. Configurar PM2

```bash
# Iniciar aplicación
pm2 start src/server.js --name evalplus-api

# Configurar inicio automático
pm2 startup systemd
pm2 save

# Verificar estado
pm2 status
pm2 logs evalplus-api
```

#### 4. Configurar Nginx

```bash
# Crear configuración
sudo nano /etc/nginx/sites-available/evalplus-api
```

**Contenido del archivo:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name evalplus-api.emprenet.work;

    access_log /var/log/nginx/evalplus-api.access.log;
    error_log /var/log/nginx/evalplus-api.error.log;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    client_max_body_size 10M;
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/evalplus-api /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

#### 5. Configurar SSL con Certbot

```bash
# Configurar DNS en Cloudflare primero
# Agregar registro A: evalplus-api.emprenet.work -> 3.141.188.154

# Obtener certificado SSL
sudo certbot --nginx -d evalplus-api.emprenet.work

# Verificar renovación automática
sudo certbot renew --dry-run
```

#### 6. Configurar Firewall

```bash
# Permitir tráfico necesario
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
sudo ufw status
```

#### 7. Verificar Despliegue

```bash
# Verificar PM2
pm2 status

# Verificar Nginx
sudo systemctl status nginx

# Probar API
curl https://evalplus-api.emprenet.work/health

# Ver logs
pm2 logs evalplus-api
sudo tail -f /var/log/nginx/evalplus-api.error.log
```

---

## 🔧 Mantenimiento

### Actualización de la Aplicación

```bash
# 1. Conectar al servidor
ssh ubuntu@3.141.188.154
cd ~/evalplus-api

# 2. Respaldar base de datos (opcional)
pg_dump evalplus_db > backup_$(date +%Y%m%d).sql

# 3. Obtener últimos cambios
git pull origin main

# 4. Instalar nuevas dependencias
npm install --production

# 5. Ejecutar migraciones
npm run migrate:latest

# 6. Reiniciar aplicación
pm2 restart evalplus-api

# 7. Verificar estado
pm2 logs evalplus-api --lines 50
```

### Monitoreo

```bash
# Ver estado de PM2
pm2 status

# Ver logs en tiempo real
pm2 logs evalplus-api

# Monitoreo interactivo
pm2 monit

# Ver métricas
pm2 describe evalplus-api

# Logs de Nginx
sudo tail -f /var/log/nginx/evalplus-api.access.log
sudo tail -f /var/log/nginx/evalplus-api.error.log
```

### Respaldos

```bash
# Respaldo de base de datos
pg_dump -U evalplus_user evalplus_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Respaldo de código (ya está en GitHub)
git push origin main

# Respaldo de variables de entorno
cp .env .env.backup.$(date +%Y%m%d)
```

### Rollback (en caso de error)

```bash
# 1. Ver commits recientes
git log --oneline -10

# 2. Volver a commit anterior
git reset --hard <commit-hash>

# 3. Reinstalar dependencias si es necesario
npm install --production

# 4. Revertir migraciones si es necesario
npm run migrate:rollback

# 5. Reiniciar aplicación
pm2 restart evalplus-api
```

---

## 👥 Contribución

### Flujo de Trabajo

1. **Fork** del repositorio
2. Crear **rama de feature** (`git checkout -b feature/nueva-funcionalidad`)
3. **Commit** de cambios (`git commit -m 'feat: Agregar nueva funcionalidad'`)
4. **Push** a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir **Pull Request**

### Convenciones de Commits

Seguimos [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: Nueva funcionalidad
fix: Corrección de bug
docs: Cambios en documentación
style: Cambios de formato (no afectan código)
refactor: Refactorización de código
test: Agregar o modificar tests
chore: Tareas de mantenimiento
perf: Mejoras de rendimiento
```

### Estándares de Código

- **ESLint** para linting
- **Prettier** para formateo
- **Comentarios** en español para lógica compleja
- **Nombres descriptivos** en inglés para variables y funciones
- **Tests** para nuevas funcionalidades

---

## 📄 Licencia

Este proyecto es propiedad de las **Unidades Tecnológicas de Santander (UTS)** y está desarrollado para uso exclusivo de la institución.

**© 2025 Unidades Tecnológicas de Santander. Todos los derechos reservados.**

---

## 📞 Contacto

### Equipo de Desarrollo

- **Proyecto**: Eval+ - Sistema de Evaluación Docente UTS
- **Institución**: Unidades Tecnológicas de Santander
- **Ubicación**: Bucaramanga, Santander, Colombia

### Soporte Técnico

Para reportar problemas o solicitar nuevas funcionalidades:

1. Abrir un **Issue** en GitHub
2. Contactar al equipo de desarrollo institucional
3. Email: soporte.evalplus@uts.edu.co (cuando esté disponible)

---

## 🙏 Agradecimientos

- **Unidades Tecnológicas de Santander** por el apoyo institucional
- **Comunidad Uteísta** por su retroalimentación
- Equipo de desarrollo y colaboradores

---

<div align="center">
  <img src="https://www.uts.edu.co/sitio/wp-content/uploads/2019/10/favicon-1-1.png" alt="UTS Logo" width="300">
</div>
