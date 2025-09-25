import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from './db.js';
import { requireAuth, requireRole } from './auth.js';

const router = Router();

const createUserSchema = z.object({
  username: z.string().min(3).max(50),
  name: z.string().min(1).max(80).optional(),
  password: z.string().min(6).max(100),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']),
});

const updateUserSchema = z.object({
  username: z.string().min(3).max(50).optional(),
  name: z.string().min(1).max(80).optional(),
  password: z.string().min(6).max(100).optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'VIEWER']).optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'Nenhum campo para atualizar' });

/**
 * POST /api/users  (ADMIN)
 * body: { username, name?, password, role }
 */
router.post('/', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const parsed = createUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', issues: parsed.error.flatten() });
    }

    const { username, name, password, role } = parsed.data;

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) return res.status(409).json({ message: 'Username já existe' });

    const passwordHash = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: { username, name, passwordHash, role },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/users  (ADMIN)
 */
router.get('/', requireAuth, requireRole(['ADMIN']), async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { id: 'asc' },
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });
    res.json(users);
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/users/:id  (ADMIN)
 * body: { username?, name?, password?, role? }
 * - Não permite alterar o próprio cargo (para evitar se auto-remover como ADMIN por engano).
 * - Se username for alterado, garante unicidade.
 * - Se password vier, re-hash.
 */
router.patch('/:id', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const me = (req as any).user;

    const parsed = updateUserSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation error', issues: parsed.error.flatten() });
    }

    const data = parsed.data;

    // Bloqueio: não pode mudar o próprio cargo para não-ADMIN
    if (me?.id === id && data.role && data.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Você não pode alterar seu próprio cargo para não-ADMIN.' });
    }

    // Se for mudar username, verificar se já existe
    if (data.username) {
      const exists = await prisma.user.findUnique({ where: { username: data.username } });
      if (exists && exists.id !== id) {
        return res.status(409).json({ message: 'Username já existe' });
      }
    }

    const updateData: any = { ...data };

    // Se for mudar senha, gerar hash
    if (data.password) {
      updateData.passwordHash = await bcrypt.hash(data.password, 10);
      delete updateData.password;
    }

    const updated = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, username: true, name: true, role: true, createdAt: true },
    });

    res.json(updated);
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    next(err);
  }
});

/**
 * DELETE /api/users/:id  (ADMIN)
 * - Evita excluir a si mesmo.
 */
router.delete('/:id', requireAuth, requireRole(['ADMIN']), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const me = (req as any).user;

    if (id === me?.id) {
      return res.status(400).json({ message: 'Você não pode excluir a si mesmo.' });
    }

    await prisma.user.delete({ where: { id } });
    res.status(204).send();
  } catch (err) {
    if ((err as any).code === 'P2025') {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    next(err);
  }
});

export default router;