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
