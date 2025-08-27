import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './docs/swagger'
import recRoutes from './routes/recommendations'
import metaRoutes from './routes/meta'

export function buildApp() {
  const app = express()
  app.use(helmet())
  app.use(cors())
  app.use(express.json())

  const v1 = express.Router()
  v1.use(recRoutes)
  v1.use(metaRoutes)
  app.use('/v1', v1)

  app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec as any))

  app.use((_req, res) => res.status(404).json({ message: 'Not found' }))
  return app
}