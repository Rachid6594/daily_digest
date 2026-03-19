# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Daily Digest is a full-stack web application with a Django REST API backend and a React/TypeScript frontend, organized as a monorepo.

## Architecture

- **`frontdailydigest/`** — React 19 frontend (Vite, TypeScript, Tailwind CSS v4)
- **`Dailydigest/`** — Django 4.2 backend (DRF, PostgreSQL, Celery+Redis)
- Frontend communicates with backend via REST API (CORS enabled, JWT auth)
- Async task processing via Celery with Redis as broker

### Frontend Patterns

- UI components in `src/ui/` follow the shadCN/ui pattern (CVA for variants)
- Business components in `src/components/`
- Path alias: `@/` → `src/`
- Class merging utility: `cn()` from `@/lib/utils.ts`

### Backend Patterns

- Environment variables managed via `python-decouple` (see `.env.example`)
- JWT authentication via `djangorestframework-simplejwt`
- API documentation via `drf-spectacular`

## Common Commands

### Frontend (`frontdailydigest/`)

```bash
npm run dev        # Dev server (port 5173)
npm run build      # TypeScript compile + Vite build
npm run lint       # ESLint
npm run preview    # Preview production build
```

### Backend (`Dailydigest/`)

```bash
pip install -r requirement.txt          # Install dependencies
python manage.py migrate                # Apply migrations
python manage.py runserver              # Dev server (port 8000)
python manage.py makemigrations         # Generate migration files
python manage.py createsuperuser        # Create admin user
```

## Language

The project team communicates in French. Commit messages and user-facing text should be in French.
