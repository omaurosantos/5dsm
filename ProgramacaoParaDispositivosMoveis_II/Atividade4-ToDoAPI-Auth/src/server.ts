import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import swaggerUi from 'swagger-ui-express';
import routes from './routes.js';
import { loadOpenApi } from './swagger.js';


import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

import passport from 'passport';
import { usePassport } from './auth.js';
app.use(usePassport);

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

import authRoutes from './authRoutes.js';
app.use('/auth', authRoutes);
app.use('/api', routes);

const openapiDoc = loadOpenApi();
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDoc));


// Serve static landing page from /public
const publicPath = path.join(__dirname, '..', 'public');
app.use(express.static(publicPath));

// SPA/LP fallback to index.html (only for non-API, non-docs routes)
app.get(['/', '/index.html'], (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📘 Swagger UI at http://localhost:${PORT}/docs`);
});
