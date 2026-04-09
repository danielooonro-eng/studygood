# StudyGood 📚

Una aplicación web completa de Next.js 14+ para gestionar y analizar materiales de estudio con IA. Permite a los usuarios crear proyectos, subir PDFs y videos, resumir contenido y hacer preguntas mediante IA.

## Características ✨

### Autenticación
- Registro e inicio de sesión seguros
- Contraseñas hasheadas con bcryptjs
- Sistema de tokens JWT
- Cookies seguras para sesiones

### Gestión de Proyectos
- Crear, editar y eliminar proyectos
- Máximo 5 proyectos por usuario
- Descripción opcional para cada proyecto
- Vista de dashboard con todos los proyectos

### Gestión de Archivos
- Subir PDFs (hasta 100MB)
- Subir videos (MP4, MOV)
- Eliminar archivos
- Almacenamiento organizado en `/public/uploads`

### Herramientas de IA
- **Resumen de PDFs**: Extrae y resume contenido automáticamente
- **Preguntas sobre PDFs**: Haz preguntas sobre tus PDFs (Q&A)
- **Resumen de Videos**: Analiza y resume contenido de videos
- **Preguntas sobre Videos**: Haz preguntas sobre tus videos

### Colaboración
- Compartir proyectos con otros usuarios por correo
- Ver lista de usuarios con quienes se comparte
- Acceso compartido a proyectos

## Requisitos 🛠️

- Node.js 18+ 
- npm o yarn
- SQLite (incluido en el proyecto)

## Instalación 📥

### 1. Clonar el repositorio

```bash
git clone https://github.com/danielooonro-eng/studygood.git
cd studygood
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env` y verifica las variables:

```bash
# .env
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
NEXT_PUBLIC_API_URL="http://localhost:3000"
```

### 4. Configurar la base de datos

```bash
npx prisma migrate dev
```

### 5. Generar cliente Prisma

```bash
npx prisma generate
```

## Ejecutar la aplicación 🚀

### Modo desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

### Modo producción

```bash
npm run build
npm start
```

## Estructura del Proyecto 📁

```
studygood/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/              # APIs de autenticación
│   │   │   └── projects/          # APIs de proyectos
│   │   ├── dashboard/             # Dashboard de proyectos
│   │   ├── login/                 # Página de login
│   │   ├── register/              # Página de registro
│   │   ├── projects/[id]/         # Página de proyecto
│   │   └── page.tsx               # Página inicio
│   ├── components/                # Componentes reutilizables
│   ├── lib/                       # Utilidades y funciones
│   └── app/layout.tsx             # Layout raíz
├── prisma/
│   ├── schema.prisma              # Esquema de base de datos
│   └── migrations/                # Migraciones de BD
├── public/
│   └── uploads/                   # Almacenamiento de archivos
└── package.json
```

## Base de Datos 🗄️

### Modelos Prisma

#### User
- `id`: Identificador único
- `email`: Correo electrónico único
- `password`: Contraseña hasheada
- `name`: Nombre del usuario
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización

#### Project
- `id`: Identificador único
- `userId`: Referencia al usuario
- `name`: Nombre del proyecto
- `description`: Descripción opcional
- `createdAt`: Fecha de creación
- `updatedAt`: Fecha de actualización

#### ProjectFile
- `id`: Identificador único
- `projectId`: Referencia al proyecto
- `type`: Tipo de archivo (pdf, video)
- `fileName`: Nombre original del archivo
- `filePath`: Ruta almacenada
- `fileSize`: Tamaño en bytes
- `uploadedAt`: Fecha de carga

#### SharedProject
- `id`: Identificador único
- `projectId`: Referencia al proyecto
- `sharedWithUserId`: Usuario con quien se comparte
- `createdAt`: Fecha de creación

## APIs 🔌

### Autenticación

```bash
# Registro
POST /api/auth/register
Content-Type: application/json

{
  "name": "Juan Pérez",
  "email": "juan@example.com",
  "password": "password123"
}

# Login
POST /api/auth/login
Content-Type: application/json

{
  "email": "juan@example.com",
  "password": "password123"
}

# Logout
POST /api/auth/logout

# Usuario actual
GET /api/auth/me
```

### Proyectos

```bash
# Listar proyectos
GET /api/projects

# Crear proyecto
POST /api/projects
{
  "name": "Biology 101",
  "description": "Estudio de biología general"
}

# Obtener proyecto
GET /api/projects/[id]

# Actualizar proyecto
PUT /api/projects/[id]
{
  "name": "Nueva nombre",
  "description": "Nueva descripción"
}

# Eliminar proyecto
DELETE /api/projects/[id]
```

### Archivos

```bash
# Subir archivo
POST /api/projects/[id]/files
Content-Type: multipart/form-data

file: <archivo>

# Eliminar archivo
DELETE /api/projects/[id]/files/[fileId]
```

### IA

```bash
# Resumir PDF
POST /api/projects/[id]/summarize-pdf

# Preguntar sobre PDF
POST /api/projects/[id]/ask-pdf
{
  "question": "¿Cuál es el tema principal?"
}

# Resumir video
POST /api/projects/[id]/summarize-video

# Preguntar sobre video
POST /api/projects/[id]/ask-video
{
  "question": "¿Cuál es el tema principal?"
}
```

### Compartir

```bash
# Compartir proyecto
POST /api/projects/[id]/share
{
  "email": "otro@example.com"
}

# Ver usuarios compartidos
GET /api/projects/[id]/share
```

## Uso de la Aplicación 💡

### 1. Crear una cuenta
- Ir a `/register`
- Llenar el formulario con nombre, email y contraseña
- Se crea automáticamente una sesión

### 2. Crear un proyecto
- En el dashboard, hacer clic en "Create New Project"
- Ingresar nombre y descripción (opcional)
- Guardar proyecto

### 3. Subir archivos
- Abrir un proyecto
- Usar el área de carga para subir PDFs o videos
- Los archivos se almacenan en `/public/uploads/[projectId]/`

### 4. Usar herramientas de IA
- **Resumir**: Hacer clic en el botón de resumen para obtener un resumen automático
- **Preguntas**: Escribir una pregunta y enviar para obtener respuestas basadas en el contenido

### 5. Compartir proyecto
- Ir a la sección "Share Project"
- Ingresar el email del usuario con el que deseas compartir
- Ese usuario podrá acceder al proyecto

## Integración con Abacus.AI 🤖

El proyecto está preparado para integrar IA avanzada. Para habilitar las funcionalidades completas de IA:

1. Conectarse a Abacus.AI API
2. Configurar los modelos de summarización y Q&A
3. Implementar en `/src/lib/ai.ts`
4. Usar en los endpoints de IA

Actualmente, el sistema proporciona respuestas placeholder. Para producción, integra:
- Modelos de summarización de texto
- Modelos de Q&A/respuesta de preguntas
- Procesamiento de transcripciones de video

## Tecnologías 🔧

- **Next.js 14**: Framework React moderno
- **TypeScript**: Tipado estático
- **Tailwind CSS**: Estilos CSS moderno
- **Prisma**: ORM para base de datos
- **SQLite**: Base de datos local
- **bcryptjs**: Hash de contraseñas
- **JWT**: Autenticación con tokens
- **pdfjs-dist**: Extracción de texto de PDFs

## Notas de Desarrollo 📝

### Estructura de autenticación
- Las cookies seguras se usan para mantener sesiones
- Los tokens JWT expiran en 7 días
- Las contraseñas se hashean con bcrypt (salt 10)

### Límites
- Máximo 5 proyectos por usuario
- Máximo 100MB por archivo
- Solo PDFs y videos permitidos

### Mejoras futuras
- [ ] Autenticación OAuth (Google, GitHub)
- [ ] Soporte para YouTube links directo
- [ ] Historial de Q&A
- [ ] Búsqueda en contenido
- [ ] Exportar resúmenes
- [ ] Colaboración en tiempo real
- [ ] Integración con Abacus.AI completa

## Solución de problemas 🐛

### Error de base de datos
```bash
# Reiniciar base de datos
rm dev.db
npx prisma migrate dev
```

### Error de módulos no encontrados
```bash
npm install
npx prisma generate
```

### Cookies no funcionan
- Verificar que `NODE_ENV` sea correcto
- En desarrollo se usan cookies no-secure
- En producción se requiere HTTPS

## Contribuciones 🤝

Para contribuir:
1. Fork el repositorio
2. Crear una rama para tu feature
3. Commit los cambios
4. Push a la rama
5. Abrir un Pull Request

## Licencia 📄

MIT License

## Soporte 📞

Para soporte o preguntas, crear un issue en el repositorio.

---

**Hecho con ❤️ usando Next.js y TypeScript**
