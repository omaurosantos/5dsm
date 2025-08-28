import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes.js';
import { loadOpenApi } from './swagger.js';

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

const openapiDoc = loadOpenApi();
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));

app.get('/', (_req, res) => {
  res.json({ ok: true, docs: '/docs', api: '/api' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📘 Swagger UI at http://localhost:${PORT}/docs`);
});
