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

## Prisma
El esquema Prisma está en:
- `apps/api/prisma/schema.prisma`

Para crear migraciones (cuando haya modelos):
```bash
npm run prisma:migrate -w apps/api
```

## Notas
- No se implementa autenticación en esta base.
- No se implementa drag and drop en esta base.
- No se implementan aún módulos de negocio.
