# Plano de Implementação — TDD, Testes e CI/CD no Projeto ToDo API

## Objetivo e Escopo
**Objetivo:** garantir qualidade e segurança de mudanças usando TDD, testes automatizados (unitários, integração e E2E) e pipeline de CI.  
**Escopo inicial:** autenticação, CRUD de tarefas, transição de status (TO_DO, IN_PROGRESS, DONE) e regras de acesso (admin/user).  
**Fora do escopo:** performance, testes de UI visual e deploy CD.

---

## Dia 1) Preparação do Repositório
- Criar branches: `chore/test-infra`, `feat/tdd-status`, `test/e2e`.
- Adicionar dependências: `vitest`, `supertest`, `cross-env`.
- Criar `vitest.config.ts` e `.env.test` com banco `todo_test`.
- Extrair `app.ts` e manter `server.ts` apenas com `app.listen()`.
- **Critério:** `npm run test` executa e finaliza sem abrir porta real.

---

## Dia 2) Rede de Segurança (Characterization Tests)
- Criar pasta `tests/` e arquivo `tests/setup.ts`.
- Escrever testes characterization para rotas existentes:
  - `GET /api/tasks` responde 200 e lista campos esperados.
  - `POST /auth/login` retorna token válido.
- **Critério:** falha se API mudar contrato sem intenção.

---

## Dia 3) Arquitetura Mínima (Ports & Adapters)
- Criar `src/core/tasks/TaskRepository.ts` e adapter Prisma.
- Criar fake `InMemoryTaskRepository` para testes unitários.
- **Critério:** unit tests rodam sem banco real.

---

## Dia 4) História via TDD — Status da Task
- Testes unitários para criação e transição de status.
- Ajustar `validation.ts` (Zod) para normalizar valores.
- Usar `PUT /api/tasks/:id { status }` para atualizar.
- **Critério:** cobertura >= 80%.

---

## Dia 5) Testes de Integração e E2E
- Testes integração (Prisma + banco teste).
- E2E com Supertest (login → CRUD → status).
- **Critério:** suite E2E passa localmente e CI.

---

## Dia 6) Pipeline de CI (GitHub Actions)
- Criar workflow `.github/workflows/ci.yml`.
- Executar Vitest em push/PR, com Postgres e coverage.
- **Critério:** CI falha se testes falharem.

---

## Dia 7) Qualidade Contínua
- Definition of Done inclui testes unit e E2E.
- Cobertura mínima inicial 70–80%.
- PR checklist: testes, cobertura, migrações validadas.

---

## Estrutura Final de Pastas
```
/src
  app.ts
  server.ts
  core/tasks/TaskRepository.ts
  infra/prisma/PrismaTaskRepository.ts
/public
  js/app.js
/tests
  setup.ts
  unit/
  e2e/
/.github/workflows/ci.yml
```

---

## Riscos e Mitigações
- Enum `TaskStatus` divergente → padronizar via script SQL.
- Seed conflitando → limpar em ordem segura.
- Flakiness E2E → usar app exportado, sem porta real.

---
