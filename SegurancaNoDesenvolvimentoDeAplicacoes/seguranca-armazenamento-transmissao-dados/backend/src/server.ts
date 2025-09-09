import fs from 'fs';
import https from 'https';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config.js';
import { publicRouter } from './routes/public.js';
import { authRouter } from './routes/auth.js';
import { contactsRouter } from './routes/contacts.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(cors({
  origin: config.origin,
  credentials: true,
  methods: ['GET', 'POST']
}));

// servir frontend (mesma origem)
app.use(express.static(
  path.resolve(__dirname, '..', '..', 'frontend', 'public')
));

// rotas da API
app.use('/api', publicRouter);
app.use('/api/auth', authRouter);
app.use('/api/contacts', contactsRouter);

// HTTPS local por padrão (sem Docker)
const useHttps = process.env.USE_HTTPS !== 'false'; // deixe sem definir no .env

if (useHttps) {
  const key = fs.readFileSync(config.ssl.keyPath);
  const cert = fs.readFileSync(config.ssl.certPath);
  https.createServer({ key, cert }, app).listen(config.port, () => {
    console.log(`HTTPS on https://localhost:${config.port}`);
  });
} else {
  http.createServer(app).listen(config.port, () => {
    console.log(`HTTP on http://localhost:${config.port}`);
  });
}