import { Router } from 'express';
import { prisma } from './db.js';
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
    const tasks = await prisma.task.findMany({
      orderBy: { id: 'asc' },
      include: {
        owner: { select: { username: true, role: true } }
      }
    });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        owner: { select: { username: true, role: true } }
      }
    });
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
    const u = req.user as any; // vem do JWT
    const created = await prisma.task.create({
      data: { ...parsed.data, ownerId: u?.id }
    });
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
    const updated = await prisma.task.update({
      where: { id },
      data: parsed.data,
    });
    res.json(updated);
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    next(err);
  }
});

router.delete('/tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    await prisma.task.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ message: 'Not found' });
    }
    next(err);
  }
});

export default router;
