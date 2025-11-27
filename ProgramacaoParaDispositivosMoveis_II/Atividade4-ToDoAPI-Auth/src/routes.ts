import { Router } from 'express';
import { createTaskSchema, updateTaskSchema } from './validation.js';
import { requireAuth } from './auth.js';
import { TaskRepositoryFactory } from './adapters/TaskRepositoryAdapter.js';
import { TaskProcessor, TaskStrategyFactory } from './strategies/TaskProcessingStrategy.js';

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
    // Usando Adapter Pattern para abstrair acesso aos dados
    const repository = TaskRepositoryFactory.getRepository();
    const tasks = await repository.findAll();
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

router.get('/tasks/:id', async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // Usando Adapter Pattern para abstrair acesso aos dados
    const repository = TaskRepositoryFactory.getRepository();
    const task = await repository.findById(id);
    if (!task) return res.status(404).json({ message: 'Not found' });
    res.json(task);
  } catch (err) {
    next(err);
  }
});

router.post('/tasks', requireAuth, async (req, res, next) => {
  try {
    // Validação com Zod (validação de schema)
    const parsed = createTaskSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', issues: parsed.error.flatten() });
    }

    const u = req.user as any; // vem do JWT
    
    // Strategy Pattern - Seleciona estratégia baseada no role do usuário
    const strategy = TaskStrategyFactory.createStrategy(u?.role);
    const processor = new TaskProcessor(strategy);
    
    // Processa os dados usando a estratégia
    const taskData = {
      title: parsed.data.title,
      description: parsed.data.description,
      status: parsed.data.status,
      ownerId: u?.id
    };
    
    const processedData = processor.process(taskData);
    
    // Validação adicional com Strategy
    const validation = processor.validate(processedData);
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Usando Adapter Pattern para criar a tarefa
    const repository = TaskRepositoryFactory.getRepository();
    const created = await repository.create(processedData);
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

    const u = req.user as any;
    
    // Strategy Pattern - Processa dados de atualização
    const strategy = TaskStrategyFactory.createStrategy(u?.role);
    const processor = new TaskProcessor(strategy);
    
    const taskData = {
      title: parsed.data.title || '',
      description: parsed.data.description,
      status: parsed.data.status
    };
    
    const processedData = processor.process(taskData);
    
    // Remove campos vazios para atualização parcial
    const updateData: any = {};
    if (processedData.title) updateData.title = processedData.title;
    if (processedData.description !== undefined) updateData.description = processedData.description;
    if (processedData.status) updateData.status = processedData.status;

    // Usando Adapter Pattern para atualizar
    const repository = TaskRepositoryFactory.getRepository();
    const updated = await repository.update(id, updateData);
    
    if (!updated) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

router.delete('/tasks/:id', requireAuth, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    // Usando Adapter Pattern para deletar
    const repository = TaskRepositoryFactory.getRepository();
    const deleted = await repository.delete(id);
    
    if (!deleted) {
      return res.status(404).json({ message: 'Not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

export default router;
