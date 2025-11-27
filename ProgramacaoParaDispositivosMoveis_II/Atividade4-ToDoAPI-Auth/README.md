# API de Tarefas (To-Do) — TypeScript + Express + JSON + Swagger

## Rodando localmente

```bash
# 1) Dentro da pasta do projeto
npm install

# 2) Ambiente de desenvolvimento (hot reload)
npm run dev

# 3) Produção
npm run build && npm start
```

- API base: `http://localhost:3000/api`
- Swagger UI: `http://localhost:3000/docs`

## Rotas principais

- `GET    /api/tasks`
- `GET    /api/tasks/:id`
- `POST   /api/tasks`
- `PUT    /api/tasks/:id`
- `DELETE /api/tasks/:id`

### Exemplo de criação

```bash
curl -X POST http://localhost:3000/api/tasks \  -H "Content-Type: application/json" \  -d '{ "title": "Nova tarefa", "description": "Teste", "status": "pending" }'
```

## Persistência
Os dados são salvos em `data/tasks.json`.

## Validação
`zod` valida os payloads para `POST` e `PUT`.


---

## Projeto Unificado (API + Landing Page)

Este repositório agora contém **API** e **Landing Page** no mesmo projeto.

- **API**: endpoints em `/api` (ex.: `/api/tasks`)
- **Docs Swagger**: `/docs`
- **Landing Page**: servida estaticamente a partir de `public/` na raiz do servidor (abre em `/`)

### Como rodar

```bash
# instalar dependências
npm install

# rodar em desenvolvimento (ts-node-dev)
npm run dev

# ou compilar e rodar em produção
npm run build
npm start
```

Após iniciar, acesse:
- http://localhost:3000/ → Landing Page
- http://localhost:3000/docs → Swagger
- http://localhost:3000/api/tasks → API

### Estrutura
```
/src            # código da API (TypeScript)
/public         # Landing Page (index.html, styles.css, js/)
/data/tasks.json
```

### Observações
- CORS permanece habilitado por padrão. Quando a LP é servida pelo mesmo domínio, CORS não é necessário, mas deixamos ativo para facilitar testes locais.
- Se desejar rodar LP e API separados, basta mover `public/` para outro projeto e configurar um `proxy` no dev server do front.


## Autenticação (Passport.js + JWT)
- Login: `POST /auth/login` com JSON `{ "username": "admin", "password": "admin123" }`
- Resposta: `{ token, user }`
- Use o token como `Authorization: Bearer <token>`
- `POST/PUT/DELETE /api/...` exigem token; `GET` permanece público.
- Para trocar a senha/usuário, edite `data/users.json` (hash gerado com bcrypt) e defina `JWT_SECRET` no `.env`.

Exemplos:
```bash
# Login
curl -X POST http://localhost:3000/auth/login -H "Content-Type: application/json" -d "{"username":"admin","password":"admin123"}"

# Chamar rota protegida criando tarefa
curl -X POST http://localhost:3000/api/tasks -H "Authorization: Bearer TOKEN_AQUI" -H "Content-Type: application/json" -d "{"title":"Nova","description":"Teste"}"
```

---

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
```

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

---

### Resumo dos Padrões

| Padrão | Tipo | Arquivo | Benefício Principal |
|--------|------|---------|---------------------|
| **Singleton** | Criacional | `src/db.ts` | Garante uma única instância do PrismaClient |
| **Adapter** | Estrutural | `src/adapters/TaskRepositoryAdapter.ts` | Abstrai acesso aos dados, permitindo trocar implementações |
| **Strategy** | Comportamental | `src/strategies/TaskProcessingStrategy.ts` | Permite diferentes estratégias de processamento baseadas no contexto |

Esses padrões trabalham em conjunto para criar uma arquitetura mais robusta, flexível e fácil de manter, seguindo os princípios SOLID e boas práticas de engenharia de software.
