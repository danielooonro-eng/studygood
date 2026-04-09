# StudyGood - Configuración para Windows

## Problema Resuelto
Prisma no está leyendo las variables de entorno del archivo `.env.local` en Windows. Este documento proporciona la solución.

## Solución: dotenv-cli

Se ha actualizado el proyecto para usar **dotenv-cli**, que carga correctamente las variables de entorno en Windows antes de ejecutar comandos de Prisma.

## Pasos para Configurar en Windows

### 1. Actualizar el Proyecto Localmente

```bash
git pull origin main
npm install
```

Esto instalará `dotenv-cli` automáticamente desde el `package.json` actualizado.

### 2. Crear el Archivo `.env.local`

Si aún no lo has creado, crea un archivo llamado `.env.local` en la raíz del proyecto:

```
DATABASE_URL="postgresql://[user]:[password]@[host]:[port]/[database]?schema=public"
JWT_SECRET="your-secret-key-change-this"
NEXT_PUBLIC_API_URL="http://localhost:3000"
NODE_ENV="development"
```

**⚠️ IMPORTANTE:** Este archivo contiene información sensible y está incluido en `.gitignore`, por lo que NO será sincronizado a GitHub.

### 3. Usar los Nuevos Scripts de Prisma

Ahora usa estos comandos en lugar de los comandos directos de Prisma:

#### Para sincronizar la base de datos (db push)
```bash
npm run prisma:push
```

Este comando:
- Carga las variables del `.env.local`
- Ejecuta `prisma db push` para sincronizar el schema con la BD

#### Para ejecutar migraciones
```bash
npm run prisma:migrate
```

#### Para abrir Prisma Studio (interfaz gráfica de BD)
```bash
npm run prisma:studio
```

### 4. Iniciar el Servidor de Desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Estructura de Carpetas

```
studygood/
├── .env.local              ← Tu archivo de configuración (NO commits)
├── .env.example            ← Plantilla de ejemplo
├── .gitignore              ← Incluye .env*
├── package.json            ← Contiene los nuevos scripts
├── prisma/
│   └── schema.prisma       ← Schema de base de datos (PostgreSQL)
├── src/
│   ├── app/
│   │   ├── api/            ← Rutas API
│   │   ├── login/
│   │   ├── register/
│   │   └── dashboard/
│   └── components/         ← Componentes React
```

## Solución de Problemas

### Error: "Environment variable not found: DATABASE_URL"

**Causa:** El archivo `.env.local` no existe o tiene un nombre incorrecto.

**Solución:**
1. Verifica que el archivo se llame **exactamente** `.env.local` (sin .env a secas)
2. Revisa que esté en la **raíz** del proyecto
3. Asegúrate de que contiene `DATABASE_URL=...`

### Error: "P1000: Authentication failed against database server"

**Causa:** La cadena de conexión (DATABASE_URL) es incorrecta.

**Solución:**
1. Verifica tu cadena `DATABASE_URL` en `.env.local`
2. Asegúrate de que el usuario, contraseña, host y puerto sean correctos
3. Prueba la conexión manualmente si es posible

### Los scripts no funcionan en PowerShell

Si estás usando **PowerShell** y los scripts no funcionan, prueba con **Command Prompt (cmd.exe)**:

```cmd
npm run prisma:push
```

O configura la ejecución en PowerShell:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## Archivos Modificados

- ✅ **package.json** - Agregados scripts con dotenv-cli
- ✅ **package-lock.json** - Actualizado con dotenv-cli
- ✅ **.gitignore** - Confirma que .env* está incluido
- ✅ **prisma/schema.prisma** - Configurado para PostgreSQL

## Confirmación de la Solución

Para verificar que todo funciona:

```bash
# Cargar variables y ejecutar Prisma Studio
npm run prisma:studio
```

Deberías ver la interfaz gráfica de Prisma sin errores de variables de entorno.

## Próximos Pasos

1. ✅ Clona o actualiza el proyecto: `git pull origin main`
2. ✅ Instala dependencias: `npm install`
3. ✅ Crea tu `.env.local` con la conexión a PostgreSQL
4. ✅ Ejecuta `npm run prisma:push` para sincronizar la BD
5. ✅ Inicia el desarrollo: `npm run dev`

## Documentación Adicional

- [Prisma Documentation](https://www.prisma.io/docs/)
- [dotenv-cli GitHub](https://github.com/entropitor/dotenv-cli)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html#LIBPQ-CONNSTRING)

---

**Última actualización:** 2026-04-09
**Versión de Prisma:** 6.15.0
**Versión de dotenv-cli:** Última disponible
