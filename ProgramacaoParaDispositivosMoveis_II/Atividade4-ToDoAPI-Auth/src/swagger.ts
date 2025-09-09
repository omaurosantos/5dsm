import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadOpenApi() {
  // Try dist/openapi.yaml (production), fallback to src/openapi.yaml (dev)
  const candidates = [
    path.resolve(__dirname, './openapi.yaml'),
    path.resolve(__dirname, '../src/openapi.yaml'),
  ];
  for (const file of candidates) {
    if (fs.existsSync(file)) {
      const text = fs.readFileSync(file, 'utf-8');
      return YAML.parse(text);
    }
  }
  throw new Error('openapi.yaml não encontrado nas localizações esperadas.');
}
