import { PrismaClient, TaskStatus } from '@prisma/client';
import { prisma } from '../db.js';

/**
 * Interface do Adapter Pattern - Define o contrato para acesso aos dados de tarefas.
 * Permite trocar entre diferentes implementações (Prisma, JSON, etc.) sem alterar o código cliente.
 */
export interface ITaskRepository {
  findAll(): Promise<any[]>;
  findById(id: number): Promise<any | null>;
  create(data: { title: string; description?: string; status?: TaskStatus; ownerId?: number }): Promise<any>;
  update(id: number, data: Partial<{ title: string; description?: string; status: TaskStatus }>): Promise<any | null>;
  delete(id: number): Promise<boolean>;
}

/**
 * Adapter Pattern - Implementação usando Prisma (banco de dados PostgreSQL).
 */
export class PrismaTaskRepository implements ITaskRepository {
  constructor(private client: PrismaClient = prisma) {}

  async findAll(): Promise<any[]> {
    return await this.client.task.findMany({
      orderBy: { id: 'asc' },
      include: {
        owner: { select: { username: true, role: true } }
      }
    });
  }

  async findById(id: number): Promise<any | null> {
    return await this.client.task.findUnique({
      where: { id },
      include: {
        owner: { select: { username: true, role: true } }
      }
    });
  }

  async create(data: { title: string; description?: string; status?: TaskStatus; ownerId?: number }): Promise<any> {
    return await this.client.task.create({
      data: {
        title: data.title,
        description: data.description,
        status: data.status || TaskStatus.TO_DO,
        ownerId: data.ownerId
      }
    });
  }

  async update(id: number, data: Partial<{ title: string; description?: string; status: TaskStatus }>): Promise<any | null> {
    try {
      return await this.client.task.update({
        where: { id },
        data
      });
    } catch (err: any) {
      if (err.code === 'P2025') {
        return null;
      }
      throw err;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await this.client.task.delete({ where: { id } });
      return true;
    } catch (err: any) {
      if (err.code === 'P2025') {
        return false;
      }
      throw err;
    }
  }
}

/**
 * Factory para criar a instância do repositório.
 * Facilita a troca entre diferentes implementações.
 */
export class TaskRepositoryFactory {
  private static repository: ITaskRepository | null = null;

  static getRepository(): ITaskRepository {
    if (!TaskRepositoryFactory.repository) {
      TaskRepositoryFactory.repository = new PrismaTaskRepository();
    }
    return TaskRepositoryFactory.repository;
  }

  static setRepository(repository: ITaskRepository): void {
    TaskRepositoryFactory.repository = repository;
  }
}
