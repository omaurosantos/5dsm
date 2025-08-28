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
