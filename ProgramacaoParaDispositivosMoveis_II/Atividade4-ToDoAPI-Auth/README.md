# Relatório do Projeto — ToDo API com Autenticação

Este repositório contém uma API de tarefas escrita em TypeScript com Express, autenticação JWT (Passport.js), persistência via Prisma/PostgreSQL e documentação Swagger. O objetivo deste relatório é registrar como o projeto foi estruturado, cobrindo práticas de TDD, padrões de projeto, funcionamento geral e o contrato das APIs expostas.

## Procedimentos de TDD
O time documentou uma cadência de implementação guiada por testes e por um pipeline de CI. O roteiro cobre desde a preparação da infraestrutura até cobertura mínima e critérios de aceitação:

- **Planejamento semanal**: passos diários detalhados para introduzir Vitest/Supertest, criar suites de characterization e evoluir para testes unitários, integração e E2E, culminando com workflow de CI no GitHub Actions e definição de cobertura mínima. Esses passos estão descritos no plano oficial do projeto.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/Plano_TDD_CI_CD_ToDoAPI.md†L1-L64】
- **Testes automatizados em memória**: a suite `tests/tasks.test.ts` injeta um `InMemoryTaskRepository` na factory de repositórios para rodar os testes sem banco real, exercitando listagem, criação e atualização de tarefas pelo app Express exportado, o que segue o princípio de substituir adaptadores em testes (Ports & Adapters).【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/tests/tasks.test.ts†L1-L79】
- **Suporte nativo a testes**: o middleware de autenticação libera um usuário fake quando `NODE_ENV=test`, permitindo que rotas protegidas sejam exercitadas sem precisar emitir JWT durante as suites automatizadas.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/auth.ts†L31-L44】

## Design Patterns Utilizados

Este projeto implementa três padrões de design fundamentais para melhorar a organização, manutenibilidade e flexibilidade do código.

### 1. Singleton (Padrão Criacional)

**Arquivo:** `src/db.ts`

**Propósito:** Garantir que exista apenas uma única instância do `PrismaClient` em toda a aplicação, evitando múltiplas conexões ao banco de dados e otimizando o uso de recursos.

**Problema Resolvido:** Sem o padrão Singleton, cada importação de `prisma` criaria uma nova instância do cliente, resultando em múltiplas conexões ao banco de dados, consumo excessivo de recursos e possíveis problemas de performance.

**Código:**

```typescript
class DatabaseSingleton {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!DatabaseSingleton.instance) {
      DatabaseSingleton.instance = new PrismaClient();
    }
    return DatabaseSingleton.instance;
  }
}

export const prisma = DatabaseSingleton.getInstance();
npm install           # instala dependências
npm run dev           # ambiente de desenvolvimento (ts-node-dev)
# ou
npm run build && npm start  # build + produção
```
- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`
- Landing page: `http://localhost:3000/`

**Benefícios:**
- Controle centralizado da instância do banco de dados
- Reutilização da mesma conexão em toda a aplicação
- Facilita o gerenciamento de recursos e desconexão

---

### 2. Adapter (Padrão Estrutural)

**Arquivo:** `src/adapters/TaskRepositoryAdapter.ts`

**Propósito:** Abstrair o acesso aos dados de tarefas através de uma interface comum, permitindo trocar entre diferentes implementações (Prisma, JSON, MongoDB, etc.) sem modificar o código cliente.

**Problema Resolvido:** O código estava diretamente acoplado ao Prisma. Se fosse necessário mudar para outro banco de dados ou sistema de armazenamento, seria necessário modificar todas as rotas. O Adapter desacopla a lógica de negócio da implementação de persistência.

**Código:**

```typescript
// Interface do Adapter
export interface ITaskRepository {
  findAll(): Promise<any[]>;
  findById(id: number): Promise<any | null>;
  create(data: {...}): Promise<any>;
  update(id: number, data: {...}): Promise<any | null>;
  delete(id: number): Promise<boolean>;
}

// Implementação com Prisma
export class PrismaTaskRepository implements ITaskRepository {
  async findAll(): Promise<any[]> {
    return await this.client.task.findMany({...});
  }
  // ... outros métodos
}

// Uso nas rotas
const repository = TaskRepositoryFactory.getRepository();
const tasks = await repository.findAll();
```

**Benefícios:**
- Facilita a troca de implementação de persistência
- Testes mais simples (pode criar um mock repository)
- Código mais limpo e desacoplado
- Permite múltiplas fontes de dados simultâneas

---

### 3. Strategy (Padrão Comportamental)

**Arquivo:** `src/strategies/TaskProcessingStrategy.ts`

**Propósito:** Definir diferentes estratégias de processamento e validação de tarefas, permitindo alterar o comportamento do processamento baseado no contexto (role do usuário, tipo de tarefa, etc.) sem modificar o código cliente.

**Problema Resolvido:** Diferentes tipos de usuários ou tarefas podem precisar de validações e processamentos diferentes. Sem o Strategy, seria necessário usar múltiplos `if/else` espalhados pelo código, tornando-o difícil de manter e estender.

**Código:**

```typescript
// Interface da Strategy
export interface ITaskProcessingStrategy {
  process(data: TaskData): TaskData;
  validate(data: TaskData): { valid: boolean; error?: string };
}

// Estratégia para administradores (validações mais rigorosas)
export class AdminTaskStrategy implements ITaskProcessingStrategy {
  process(data: TaskData): TaskData {
    return { ...data, title: data.title.trim() };
  }
  validate(data: TaskData): { valid: boolean; error?: string } {
    if (data.title.length < 5) {
      return { valid: false, error: 'Título deve ter pelo menos 5 caracteres' };
    }
    return { valid: true };
  }
}

// Uso nas rotas
const strategy = TaskStrategyFactory.createStrategy(userRole);
const processor = new TaskProcessor(strategy);
const processedData = processor.process(taskData);
```

**Benefícios:**
- Fácil adicionar novas estratégias sem modificar código existente
- Comportamento configurável em tempo de execução
- Separação clara de responsabilidades
- Código mais testável e manutenível

**Estratégias Implementadas:**
- `DefaultTaskStrategy`: Validação padrão para usuários comuns
- `AdminTaskStrategy`: Validações mais rigorosas para administradores
- `PriorityTaskStrategy`: Processamento especial para tarefas prioritárias
## APIs Disponíveis

---
### Autenticação (`/auth`)
- `POST /auth/login` — autentica via strategy Local e retorna `{ token, user }` em caso de sucesso.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/authRoutes.ts†L9-L21】
- `GET /auth/me` — requer JWT e retorna os dados do usuário autenticado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/authRoutes.ts†L23-L25】

### Resumo dos Padrões
### Tarefas (`/api/tasks`)
- `GET /api/tasks` — lista todas as tarefas usando o repositório configurado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L44-L54】
- `GET /api/tasks/:id` — busca tarefa por ID ou retorna 404.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L56-L69】
- `POST /api/tasks` — requer JWT; valida payload com Zod e Strategy, cria a tarefa associando o dono autenticado.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L71-L115】
- `PUT /api/tasks/:id` — requer JWT; aplica a strategy para normalizar/validar e atualiza a tarefa existente ou retorna 404.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L117-L157】
- `DELETE /api/tasks/:id` — requer JWT; remove a tarefa e retorna 204 ou 404 se não existir.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L159-L177】

| Padrão | Tipo | Arquivo | Benefício Principal |
|--------|------|---------|---------------------|
| **Singleton** | Criacional | `src/db.ts` | Garante uma única instância do PrismaClient |
| **Adapter** | Estrutural | `src/adapters/TaskRepositoryAdapter.ts` | Abstrai acesso aos dados, permitindo trocar implementações |
| **Strategy** | Comportamental | `src/strategies/TaskProcessingStrategy.ts` | Permite diferentes estratégias de processamento baseadas no contexto |

## Como o Projeto Funciona

- **Aplicação Express**: `src/app.ts` cria a aplicação, habilita CORS, JSON, logs com Morgan, inicializa o Passport, registra rotas de autenticação (`/auth`), rotas de tarefas (`/api`) e rotas administrativas de usuários (`/api/users`), além de servir a documentação Swagger em `/docs` e a landing page estática em `/`.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/app.ts†L1-L36】
- **Autenticação**: `src/auth.ts` configura estratégias Local (login) e JWT (proteção das rotas), expõe helpers para emitir tokens e middleware `requireAuth`/`requireRole` que controlam acesso baseado em papéis armazenados no banco via Prisma.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/auth.ts†L1-L64】【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/userRoutes.ts†L1-L78】
- **Processamento de tarefas**: as rotas de tarefas escolhem estratégias conforme o role do usuário, processam e validam dados com `TaskProcessor` e delegam operações ao repositório criado pela factory, mantendo o domínio desacoplado da infraestrutura de banco.【F:ProgramacaoParaDispositivosMoveis_II/Atividade4-ToDoAPI-Auth/src/routes.ts†L1-L122】
