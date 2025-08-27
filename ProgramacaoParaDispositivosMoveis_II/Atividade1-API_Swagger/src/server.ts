import { buildApp } from './app'

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000
const app = buildApp()

app.listen(PORT, () => {
console.log(`Agro Recommender API rodando em http://localhost:${PORT} (Swagger em /docs)`)
})