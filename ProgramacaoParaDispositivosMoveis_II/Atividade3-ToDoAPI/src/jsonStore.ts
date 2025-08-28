import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Task } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_PATH = path.resolve(__dirname, '../data/tasks.json');

type DBShape = { lastId: number; tasks: Task[] };

async function readDB(): Promise<DBShape> {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf-8');
    return JSON.parse(raw) as DBShape;
  } catch (err: any) {
    if (err.code === 'ENOENT') {
      const empty: DBShape = { lastId: 0, tasks: [] };
      await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
      await fs.writeFile(DATA_PATH, JSON.stringify(empty, null, 2), 'utf-8');
      return empty;
    }
    throw err;
  }
}

async function writeDB(db: DBShape): Promise<void> {
  await fs.writeFile(DATA_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

export const store = {
  async list(): Promise<Task[]> {
    const db = await readDB();
    return db.tasks;
  },
  async get(id: number): Promise<Task | undefined> {
    const db = await readDB();
    return db.tasks.find(t => t.id === id);
  },
  async create(input: Omit<Task, 'id'>): Promise<Task> {
    const db = await readDB();
    const id = ++db.lastId;
    const task: Task = { id, ...input };
    db.tasks.push(task);
    await writeDB(db);
    return task;
  },
  async update(id: number, input: Partial<Omit<Task, 'id'>>): Promise<Task | undefined> {
    const db = await readDB();
    const idx = db.tasks.findIndex(t => t.id === id);
    if (idx === -1) return undefined;
    db.tasks[idx] = { ...db.tasks[idx], ...input };
    await writeDB(db);
    return db.tasks[idx];
  },
  async remove(id: number): Promise<boolean> {
    const db = await readDB();
    const lenBefore = db.tasks.length;
    db.tasks = db.tasks.filter(t => t.id !== id);
    const changed = db.tasks.length !== lenBefore;
    if (changed) await writeDB(db);
    return changed;
  }
};
