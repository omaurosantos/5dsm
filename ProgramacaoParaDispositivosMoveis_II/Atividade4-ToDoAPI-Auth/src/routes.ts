import { Router } from 'express';
import { store } from './jsonStore.js';
import { createTaskSchema, updateTaskSchema } from './validation.js';
import { requireAuth } from './auth.js';

const router = Router();

/**
 * @openapi
 * /tasks:
 *   get:
 *     summary: Lista todas as tarefas
 *     responses:
 *       200:
 *         description: Lista de tarefas
 *   post:
 *     summary: Cria uma nova tarefa
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTask'
 *     responses:
 *       201:
 *         description: Tarefa criada
 * /tasks/{id}:
 *   get:
 *     summary: Obtém uma tarefa pelo ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tarefa encontrada
 *       404:
 *         description: Não encontrada
 *   put:
 *     summary: Atualiza uma tarefa (replace/merge)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTask'
 *     responses:
 *       200:
 *         description: Tarefa atualizada
 *       404:
 *         description: Não encontrada
 *   delete:
 *     summary: Exclui uma tarefa
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       204:
 *         description: Excluída
 */

router.get('/tasks', async (_req, res, next) => {
  try {
    const tasks = await store.list();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const task = await store.get(id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/tasks', requireAuth, async (req, res, next) => {
  try {
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', issues: parsed.error.flatten() });
    }
    const created = await store.create(parsed.data);
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.put('/tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const parsed = updateTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', issues: parsed.error.flatten() });
    }
    const updated = await store.update(id, parsed.data);
    if (!updated) return res.status(404).json({ message: 'Not found' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const removed = await store.remove(id);
    if (!removed) return res.status(404).json({ message: 'Not found' });
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
