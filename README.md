# LifeTasker

Base monorepo para **LifeTasker**, una app de productividad personal enfocada en **progreso semanal flexible** (no una todo-list diaria).

## Stack
- Frontend: Next.js (App Router) + TypeScript + TailwindCSS
- Backend: NestJS + TypeScript
- DB: PostgreSQL
- ORM: Prisma
- Monorepo: `apps/web` + `apps/api`

## Estructura
- `apps/web`: frontend
- `apps/api`: backend con endpoint health y Prisma
- `docker-compose.yml`: servicio de PostgreSQL
- `.env.example`: variables de entorno base

## Requisitos
- Node.js 20+
- npm 10+
- Docker + Docker Compose

## Configuración
1. Instalar dependencias:
   ```bash
   npm install
   ```
2. Copiar variables de entorno:
   ```bash
   cp .env.example .env
   ```
3. Levantar PostgreSQL:
   ```bash
   docker compose up -d
   ```
4. Generar cliente de Prisma:
   ```bash
   npm run prisma:generate -w apps/api
   ```

## Desarrollo
### Ejecutar frontend
```bash
npm run dev:web
```
Disponible en `http://localhost:3000`.

### Ejecutar backend
```bash
npm run dev:api
```
Backend en `http://localhost:4000`.

Health check:
- `GET http://localhost:4000/api/health`

### Ejecutar ambos
```bash
npm run dev
```

## Base de datos con Prisma
El esquema Prisma está en:
- `apps/api/prisma/schema.prisma`

Comandos principales:

```bash
# Formatear esquema
npm run prisma:generate -w apps/api

# Crear/aplicar migración en desarrollo
npm run prisma:migrate -w apps/api -- --name init

# Aplicar migraciones existentes (entorno no-dev)
npm run prisma:migrate:deploy -w apps/api

# Ejecutar seed de categorías por defecto
npm run prisma:seed -w apps/api

# Abrir Prisma Studio
npm run prisma:studio -w apps/api
```

Seed por defecto:
- TECH
- SALUD
- TRABAJO
- FAMILIA

## Notas
- No se implementa autenticación en esta base.
- No se implementa drag and drop en esta base.
- Se implementan módulos REST de negocio en backend (Phase 3) con usuario demo temporal.
- No se implementan aún pantallas de negocio en frontend.


## Backend REST API (Phase 3)
Base URL versionada: `http://localhost:4000/api/v1`

Ejemplos:

```bash
# Categorías
curl http://localhost:4000/api/v1/categories

# Crear block type
curl -X POST http://localhost:4000/api/v1/block-types   -H "Content-Type: application/json"   -d '{"name":"Deep Work","durationMinutes":60,"categoryId":"<categoryId>","description":"Focus session"}'

# Listar block types
curl http://localhost:4000/api/v1/block-types

# Crear plan semanal
curl -X POST http://localhost:4000/api/v1/weekly-plans   -H "Content-Type: application/json"   -d '{"weekStartDate":"2026-05-04","items":[{"blockTypeId":"<id>","targetCount":5}]}'

# Obtener plan semanal actual
curl http://localhost:4000/api/v1/weekly-plans/current

# Completar bloque
curl -X POST http://localhost:4000/api/v1/block-instances/complete   -H "Content-Type: application/json"   -d '{"blockTypeId":"<id>","notes":"Completed after lunch"}'

# Progreso semanal
curl http://localhost:4000/api/v1/progress/current-week
```
