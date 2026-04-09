# Guía de Deployment 🚀

## Opciones de Deployment

### Vercel (Recomendado)

Vercel es la plataforma oficial para Next.js y es la más fácil de usar.

#### Pasos:

1. **Conectar repositorio**
   - Ir a https://vercel.com
   - Conectar tu cuenta GitHub
   - Seleccionar el repositorio `studygood`

2. **Configurar variables de entorno**
   - En Vercel Dashboard → Settings → Environment Variables
   - Agregar las variables necesarias:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=tu-secreto-seguro
   NEXT_PUBLIC_API_URL=https://tu-dominio.vercel.app
   ```

3. **Configurar base de datos**
   - Para producción, usar PostgreSQL (no SQLite)
   - Servicio recomendado: Vercel Postgres o Supabase
   - Actualizar `DATABASE_URL` con la URL de PostgreSQL

4. **Deploy automático**
   - Cada push a `main` despliega automáticamente
   - Las pull requests crean preview deployments

### Railway

Railway simplifica el deployment con soporte para bases de datos.

#### Pasos:

1. **Crear proyecto**
   - Ir a https://railway.app
   - Crear nuevo proyecto
   - Conectar repositorio GitHub

2. **Agregar base de datos**
   - Agregar PostgreSQL plugin
   - Copiar DATABASE_URL a variables de entorno

3. **Configurar variables**
   - Agregar `JWT_SECRET`
   - Agregar `NEXT_PUBLIC_API_URL`

4. **Deploy**
   - Railway despliega automáticamente en cada push

### Docker

Para containerizar la aplicación.

#### Dockerfile:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Build
RUN npm run build

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nextjs

EXPOSE 3000

CMD ["npm", "start"]
```

#### docker-compose.yml:

```yaml
version: '3.8'

services:
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: studygood
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  app:
    build: .
    environment:
      DATABASE_URL: postgresql://postgres:password@db:5432/studygood
      JWT_SECRET: your-secret-key
      NEXT_PUBLIC_API_URL: http://localhost:3000
    ports:
      - "3000:3000"
    depends_on:
      - db

volumes:
  postgres_data:
```

### AWS

#### Usando Amplify:

1. **Conectar repositorio**
   - AWS Amplify → New app → Connect your repo

2. **Configurar build settings**
   ```
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm install
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: .next
   ```

3. **Configurar base de datos**
   - Usar RDS para PostgreSQL
   - Configurar variables de entorno

#### Usando ECS:

1. **Crear imagen Docker**
2. **Push a ECR (Elastic Container Registry)**
3. **Crear ECS service**
4. **Configurar RDS para base de datos**
5. **Load Balancer (ALB)**

## Migraciones de Base de Datos

### Antes de hacer deploy:

```bash
# Crear migración
npx prisma migrate deploy

# Verificar estado
npx prisma migrate status

# Sincronizar schema
npx prisma db push
```

### En producción:

```bash
# En tu CI/CD pipeline
npx prisma migrate deploy
```

## Variables de Entorno en Producción

```env
# Base de datos (usar PostgreSQL)
DATABASE_URL="postgresql://user:password@host:5432/studygood"

# Seguridad
JWT_SECRET="generateYourSecureKeyHere"
NODE_ENV="production"

# Dominio
NEXT_PUBLIC_API_URL="https://tu-dominio.com"
```

## SSL/HTTPS

- Vercel: Automático con Let's Encrypt
- Railway: Automático con certificados
- AWS: Usar ACM (AWS Certificate Manager)
- Docker: Usar Nginx reverse proxy con certificados

## Monitoreo

### Logs
- Vercel: Dashboard → Logs
- Railway: Dashboard → Logs
- AWS: CloudWatch Logs
- Docker: `docker logs <container-id>`

### Alertas
- Configurar alertas de error
- Monitorear uso de base de datos
- Vigilar performance

## Performance

### Optimizaciones recomendadas:
1. **Caching**
   - Configurar CDN (Vercel Edge, Cloudflare)
   - Redis para sesiones (opcional)

2. **Base de datos**
   - Crear índices en campos frecuentes
   - Usar connection pooling (PgBouncer)

3. **Images**
   - Usar Next.js Image Component
   - Optimizar tamaño de uploads

4. **API**
   - Implementar rate limiting
   - Usar compression

## Backups

### PostgreSQL
```bash
# Backup
pg_dump "your-connection-string" > backup.sql

# Restore
psql "your-connection-string" < backup.sql
```

### Vercel/Railway
- Backups automáticos
- Verificar en configuración de base de datos

## Troubleshooting

### Error: DATABASE_URL not found
- Verificar variables de entorno están configuradas
- Reiniciar deployment después de agregar variables

### Error: Migration failed
```bash
# Ver migrations pending
npx prisma migrate status

# Forzar resetear (desarrollo solo)
npx prisma migrate reset
```

### Error: Out of memory
- Aumentar memoria de contenedor
- Optimizar queries de base de datos
- Implementar pagination

## Checklist de Production

- [ ] Variables de entorno configuradas
- [ ] HTTPS/SSL habilitado
- [ ] Base de datos en producción (PostgreSQL)
- [ ] Backups configurados
- [ ] Logs configurados
- [ ] Alertas configuradas
- [ ] Monitoreo activo
- [ ] Rate limiting implementado
- [ ] CORS configurado correctamente
- [ ] Security headers configurados

---

Para soporte, crear un issue en GitHub.
