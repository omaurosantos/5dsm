# Plano de Aplicação do TDD em 7 Dias – Projeto **abp_5dsm**

Este plano operacionaliza o uso de **TDD (Test‑Driven Development)** no repositório `abp_5dsm`, cobrindo backend (Node/Express/Prisma), AI model (FastAPI) e frontend (React Native/Expo). O roteiro segue o ciclo **Red → Green → Refactor**, com entregáveis diários (Definition of Done – DoD), exemplos de arquivos, comandos e sugestões de estrutura.

---

## Sumário
- [Dia 1 — Diagnóstico e Setup](#dia-1--diagnóstico-e-setup)
- [Dia 2 — Characterization Tests](#dia-2--characterization-tests)
- [Dia 3 — Ports & Adapters e Injeção de Dependências](#dia-3--ports--adapters-e-injeção-de-dependências)
- [Dia 4 — Primeira história em TDD (Red → Green → Refactor)](#dia-4--primeira-história-em-tdd-red--green--refactor)
- [Dia 5 — Refatorações Seguras e Cobertura](#dia-5--refatorações-seguras-e-cobertura)
- [Dia 6 — Integração, Contratos e E2E](#dia-6--integração-contratos-e-e2e)
- [Dia 7 — Normas, Métricas e Expansão](#dia-7--normas-métricas-e-expansão)
- [Ajustes por Pasta](#ajustes-por-pasta)
- [Riscos & Mitigações](#riscos--mitigações)
- [Resultados Esperados](#resultados-esperados)

---

## Dia 1 — Diagnóstico e Setup
**Objetivo:** CI rodando e test frameworks prontos.

### 1) Estruturas de teste
**Backend (`backend`)**
- Pastas:
  - `backend/tests/unit/`
  - `backend/tests/integration/`
  - `backend/tests/e2e/`
- **Jest config** (se faltar) – `backend/jest.config.ts`:
```ts
import type {Config} from 'jest';
const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'],
  collectCoverage: true,
  collectCoverageFrom: ['src/**/*.ts', '!src/**/index.ts'],
  coverageThreshold: { global: { lines: 70, functions: 70, branches: 60 } }
};
export default config;
```

**AI Model (`ai_model`)**
- Dependências a adicionar no `requirements.txt` (se não existirem): `pytest`, `pytest-cov`, `httpx`, `pytest-asyncio`.
- Criar `ai_model/tests/` e `conftest.py`.

**Frontend (`frontend`)**
- Dependências: `jest`, `@testing-library/react`, `@testing-library/react-native`, `jest-expo`.
- Pasta `frontend/__tests__/`.

### 2) CI básico (GitHub Actions)
Arquivo `.github/workflows/ci.yml` na raiz do repositório:
```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  backend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: backend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx prisma generate
      - run: npm test --silent

  ai_model:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: ai_model } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with: { python-version: '3.11' }
      - run: pip install -r requirements.txt
      - run: pytest -q --maxfail=1 --disable-warnings

  frontend:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: frontend } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npx jest -c jest.config.js --runInBand
```

**DoD do dia 1:** pipeline verde executando testes placeholder em cada subprojeto.

---

## Dia 2 — Characterization Tests
**Objetivo:** capturar o comportamento atual **sem alterá‑lo**, criando uma rede de segurança para refatorações.

### 1) Backend
Teste de saúde (exemplo) – `backend/tests/e2e/health.e2e.test.ts`:
```ts
import request from 'supertest';
import app from '../../server';

describe('Health', () => {
  it('GET /health retorna OK', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'OK');
  });
});
```

Para endpoints de domínio (ex.: `/api/alunos`), criar **happy paths** baseados no comportamento atual (mesmo que imperfeito). Isso “fotografa” o estado vigente.

### 2) AI Model
Teste de caracterização de API – `ai_model/tests/test_api_prediction.py`:
```python
import pytest
from httpx import AsyncClient
from src.app import app

@pytest.mark.asyncio
async def test_health_and_predict():
    async with AsyncClient(app=app, base_url="http://test") as ac:
        r = await ac.get("/health")
        assert r.status_code == 200
        # payload mínimo aceito hoje
        payload = {"student_id": 123, "features": {"age": 17, "absences": 2}}
        r = await ac.post("/predict", json=payload)
        assert r.status_code in (200, 422)  # fotografa comportamento atual
```

### 3) Frontend
Snapshots com `@testing-library/react-native` da tela inicial (ex.: `DashboardScreen`), verificando render básico e textos-chave.

**DoD do dia 2:** fluxos críticos cobertos por characterization tests (saúde, autenticação se houver, CRUD básico).

---

## Dia 3 — Ports & Adapters e Injeção de Dependências
**Objetivo:** facilitar isolamento de unidades em teste; remover dependência direta de infraestrutura (DB, rede).

### 1) Backend
- Criar **ports** em `backend/src/domain/ports/` (ex.: `AlunoRepository.ts`, `CursoRepository.ts`).
- Criar **adapters** Prisma em `backend/src/infra/prisma/` (ex.: `AlunoPrismaRepository.ts`).
- Adicionar **container DI** simples em `backend/src/infra/di/container.ts`.
- Controllers passam a depender das **ports** (não de Prisma diretamente).

### 2) AI Model
- Separar **lógica de modelo** da camada FastAPI:
  - `src/models/ports.py` (ex.: interface `Predictor`)
  - `src/models/dropout_service.py` (implementação)
  - `src/models/fakes.py` (mocks/fakes para testes)
- Injeção via construtores ou factory.

### 3) Frontend
- Extrair chamadas HTTP para `src/services/api.ts`. Base URL injetada por contexto (facilita mocking em testes).

**DoD do dia 3:** unidades testáveis sem DB/rede/disco; testes usando fakes e mocks executam em memória.

---

## Dia 4 — Primeira história em TDD (Red → Green → Refactor)
**Objetivo:** aplicar TDD completo em uma microhistória real.

> **História sugerida (backend):** “Como admin, quero criar **Aluno** validando **e‑mail**/CPF únicos.”

### Passos
1. **RED — Escreva o teste primeiro** (`backend/tests/unit/aluno/createAluno.usecase.test.ts`):
```ts
import { CreateAluno } from '../../src/usecases/aluno/CreateAluno';
import { FakeAlunoRepository } from '../fakes/FakeAlunoRepository';

test('não deve permitir email duplicado', async () => {
  const repo = new FakeAlunoRepository([{ id:1, email:'a@a.com', nome:'Ana' }]);
  const usecase = new CreateAluno(repo);
  await expect(usecase.execute({ email: 'a@a.com', nome:'Beto'}))
    .rejects.toThrow('EMAIL_DUPLICADO');
});
```
2. **GREEN — Implemente o mínimo** para passar no teste (na `CreateAluno`, usando a **port**).
3. **REFACTOR — Limpe o código** (extrair validações, nomes claros, remover duplicação, mover detalhes para helpers).

**DoD do dia 4:** história entregue com testes passando e código limpo.

---

## Dia 5 — Refatorações Seguras e Cobertura
**Objetivo:** elevar qualidade/legibilidade e atingir **cobertura ≥ 70%** (linhas).

### Backend
- Cobrir services e controllers com unit/integration.
- Fakes/mocks para adapters (e-mail, auth, etc.).
- Banco de testes:
  - **Rápido:** SQLite com Prisma (`DATABASE_URL="file:./test.db"`).
  - **Realista:** Testcontainers (Postgres) para integração.
- Migrations no CI: usar `prisma migrate deploy` em DB efêmero.

### AI Model
- Testar serviços de predição com fixtures em `tests/fixtures/`.
- Validar contratos de entrada/saída com `pydantic`.

### Frontend
- Testar componentes (`StudentItem`) e telas (`Login`, `Dashboard`), com mocks de API.

### Gates de Qualidade
- Jest: `coverageThreshold` (backend/frontend).
- Pytest: `pytest --cov=src --cov-fail-under=70` (ai_model).

**DoD do dia 5:** cobertura global ≥70%, builds verdes, complexidade reduzida em módulos críticos.

---

## Dia 6 — Integração, Contratos e E2E
**Objetivo:** validar contratos entre serviços e o fluxo ponta a ponta.

### 1) Contratos Backend ↔ AI Model
- Teste de contrato (ex.: Pact) ou integração com mock server:
  - `backend/tests/integration/ai_contract.test.ts` validando schema de `POST /predict` e a resposta.

### 2) E2E simplificado
- Subir DB via docker-compose (já em `backend/docker/docker-compose.yml`), subir `ai_model` local.
- Usar **Supertest** no backend para: autenticar → criar aluno → chamar predição → validar resposta.
- Rodar E2E em `--runInBand` para reduzir flakiness.

### 3) Mutation Testing (piloto)
- Backend: `@stryker-mutator/core` em um módulo de domínio (ex.: Aluno).
- AI Model (opcional): `mutmut` focal em funções puras.

**DoD do dia 6:** contrato estabilizado e cenário E2E principal validado.

---

## Dia 7 — Normas, Métricas e Expansão
**Objetivo:** institucionalizar o TDD e preparar terreno para CD e evolução.

### 1) Definition of Done (DoD) do projeto
Toda PR deve conter:
- 🧪 Teste de unidade (e, se tocar rota/serviço, **teste de integração**).
- ✅ Cobertura não pode cair (≥ 70% global).
- 🔍 Linter + typecheck + `pytest` OK.
- 📄 Changelog curto no corpo da PR ou `CHANGELOG.md` atualizado.

Publicar em `CONTRIBUTING.md` e referenciar no README.

### 2) Badges e Dashboard
- Badges de **build**, **coverage** e **mutation score** no `README.md` de cada subprojeto.
- Exportar relatórios de cobertura no Actions (sumário do job).

### 3) Plano de Expansão
- Semana 2: módulo **Curso**.
- Semana 3: **Matrícula**.
- Manter cadência TDD (planejar histórias pequenas), pair reviews focados em Red→Green→Refactor.

**DoD do dia 7:** normas publicadas, políticas ativas no CI e backlog de expansão por módulo.

---

## Ajustes por Pasta

### Backend (Node/Express/Prisma)
**Scripts no `package.json`:**
```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:e2e": "jest tests/e2e"
  }
}
```
- Preferir SQLite para velocidade em testes; usar Testcontainers quando precisar do Postgres real.
- Em integração no CI, rodar `prisma migrate deploy` num banco efêmero antes dos testes.
- Introduzir factories/fixtures para dados (`tests/factories/aluno.ts`).

### AI Model (FastAPI)
- Estruturar camadas: `src/models/` (regras), `src/app.py` (API), `src/models/ports.py` (interfaces), `src/models/fakes.py` (mocks).
- Comando: `pytest -q --cov=src --cov-report=term-missing`.
- Validar contratos com `pydantic` e testes de schema.

### Frontend (Expo/React Native)
- `jest-expo` + `@testing-library/react-native` para testes de UI.
- Mocks para `fetch`/axios e para o **Context** de API (injeção de base URL).

---

## Riscos & Mitigações
- **Acoplamento a Prisma/infra** → Aplicar Ports & Adapters (Dia 3) e DI.
- **Dados de teste frágeis** → Usar factories e fixtures; seeds separados para dev.
- **Flaky E2E** → Isolar com containers, fixtures determinísticas, `--runInBand` e retries controlados.
- **Queda de cobertura ao refatorar** → Characterization tests e gates de cobertura no CI.

---

## Resultados Esperados
- **Feedback rápido** a cada commit (CI + TDD).
- **Design mais limpo e testável** (Red → Green → Refactor).
- **Base pronta para CD** (empacotar e publicar quando desejarem).
- **Cultura de qualidade** com DoD, métricas e automações visíveis.

> Dica final: priorize histórias pequenas por domínio (Aluno → Curso → Matrícula), mantendo o ciclo TDD curto e revisões focadas em comportamento e clareza.
