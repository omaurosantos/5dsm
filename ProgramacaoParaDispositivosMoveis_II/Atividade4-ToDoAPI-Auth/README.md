# Relatório do Projeto — ToDo API com Autenticação

Este repositório contém uma API de tarefas escrita em TypeScript com Express, autenticação JWT (Passport.js), persistência via Prisma/PostgreSQL e documentação Swagger. O objetivo deste relatório é registrar como o projeto foi estruturado, cobrindo práticas de TDD, padrões de projeto, funcionamento geral e o contrato das APIs expostas.

## Procedimentos de TDD
O time documentou uma cadência de implementação guiada por testes e por um pipeline de CI. O roteiro cobre desde a preparação da infraestrutura até cobertura mínima e critérios de aceitação:

- **Planejamento semanal**: passos diários detalhados para introduzir Vitest/Supertest, criar suites de characterization e evoluir para testes unitários, integração e E2E, culminando com workflow de CI no GitHub Actions e definição de cobertura mínima. Esses passos estão descritos no plano oficial do projeto.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/Plano_TDD_CI_CD_ToDoAPI.md†L1-L64】
- **Testes automatizados em memória**: a suite `tests/tasks.test.ts` injeta um `InMemoryTaskRepository` na factory de repositórios para rodar os testes sem banco real, exercitando listagem, criação e atualização de tarefas pelo app Express exportado, o que segue o princípio de substituir adaptadores em testes (Ports & Adapters).【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/tests/tasks.test.ts†L1-L79】
- **Suporte nativo a testes**: o middleware de autenticação libera um usuário fake quando `NODE_ENV=test`, permitindo que rotas protegidas sejam exercitadas sem precisar emitir JWT durante as suites automatizadas.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/auth.ts†L31-L44】

## Padrões de Projeto Utilizados
A API aplica três padrões para manter desacoplamento e flexibilidade:

- **Singleton** (`src/db.ts`): garante uma única instância de `PrismaClient`, evitando múltiplas conexões simultâneas e permitindo desligamento controlado quando necessário.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/db.ts†L1-L33】
- **Adapter + Factory** (`src/adapters/TaskRepositoryAdapter.ts`): define a interface `ITaskRepository`, implementa o adaptador `PrismaTaskRepository` e expõe uma factory que permite trocar a implementação (por exemplo, o repositório em memória usado nos testes) sem alterar as rotas.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/adapters/TaskRepositoryAdapter.ts†L1-L86】
- **Strategy + Context + Factory** (`src/strategies/TaskProcessingStrategy.ts`): encapsula regras de processamento/validação de tarefas em estratégias (padrão, admin e prioridade), com um contexto `TaskProcessor` para alternar em tempo de execução conforme o papel do usuário ou tipo de tarefa.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/strategies/TaskProcessingStrategy.ts†L1-L124】

## Como o Projeto Funciona

- **Aplicação Express**: `src/app.ts` cria a aplicação, habilita CORS, JSON, logs com Morgan, inicializa o Passport, registra rotas de autenticação (`/auth`), rotas de tarefas (`/api`) e rotas administrativas de usuários (`/api/users`), além de servir a documentação Swagger em `/docs` e a landing page estática em `/`.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/app.ts†L1-L36】
- **Autenticação**: `src/auth.ts` configura estratégias Local (login) e JWT (proteção das rotas), expõe helpers para emitir tokens e middleware `requireAuth`/`requireRole` que controlam acesso baseado em papéis armazenados no banco via Prisma.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/auth.ts†L1-L64】【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L1-L78】
- **Processamento de tarefas**: as rotas de tarefas escolhem estratégias conforme o role do usuário, processam e validam dados com `TaskProcessor` e delegam operações ao repositório criado pela factory, mantendo o domínio desacoplado da infraestrutura de banco.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L1-L122】

### Como rodar
```bash
npm install           # instala dependências
npm run dev           # ambiente de desenvolvimento (ts-node-dev)
# ou
npm run build && npm start  # build + produção
```
- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- Landing page: `http://localhost:3000/`

## APIs Disponíveis

### Autenticação (`/auth`)
- `POST /auth/login` — autentica via strategy Local e retorna `{ token, user }` em caso de sucesso.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/authRoutes.ts†L9-L21】
- `GET /auth/me` — requer JWT e retorna os dados do usuário autenticado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/authRoutes.ts†L23-L25】

### Tarefas (`/api/tasks`)
- `GET /api/tasks` — lista todas as tarefas usando o repositório configurado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L44-L54】
- `GET /api/tasks/:id` — busca tarefa por ID ou retorna 404.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L56-L69】
- `POST /api/tasks` — requer JWT; valida payload com Zod e Strategy, cria a tarefa associando o dono autenticado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L71-L115】
- `PUT /api/tasks/:id` — requer JWT; aplica a strategy para normalizar/validar e atualiza a tarefa existente ou retorna 404.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L117-L157】
- `DELETE /api/tasks/:id` — requer JWT; remove a tarefa e retorna 204 ou 404 se não existir.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L159-L177】

### Administração de Usuários (`/api/users`)
- `POST /api/users` — apenas `ADMIN`; cria usuário com hash de senha e papel fornecido.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L10-L47】
- `GET /api/users` — apenas `ADMIN`; lista usuários com dados básicos ordenados por ID.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L49-L58】
- `PATCH /api/users/:id` — apenas `ADMIN`; atualiza campos opcionais, com bloqueios para auto-rebaixamento e validação de unicidade de username.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L60-L105】
- `DELETE /api/users/:id` — apenas `ADMIN`; impede autoexclusão e remove o usuário informado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L107-L132】

Com este relatório, é possível visualizar a disciplina de testes aplicada (TDD + CI), os padrões de design adotados e o contrato das APIs que sustentam a aplicação.
