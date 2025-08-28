import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import YAML from 'yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadOpenApi() {
  const file = path.resolve(__dirname, './openapi.yaml');
  const text = fs.readFileSync(file, 'utf-8');
  const doc = YAML.parse(text);
  return doc;
}
