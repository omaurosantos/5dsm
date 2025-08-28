import { z } from 'zod';

export const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['pending', 'done']).default('pending')
});

export const updateTaskSchema = createTaskSchema.partial();
