import { z } from 'zod';

export const StatusEnum = z.enum(['TO_DO', 'IN_PROGRESS', 'DONE']);

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  // opcional na criação; BD assume TO_DO
  status: StatusEnum.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: StatusEnum.optional(),
}).refine(obj => Object.keys(obj).length > 0, { message: 'Nada para atualizar' });