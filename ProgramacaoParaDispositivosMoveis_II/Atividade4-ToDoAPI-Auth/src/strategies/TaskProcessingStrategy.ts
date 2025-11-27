import { TaskStatus } from '@prisma/client';

/**
 * Strategy Pattern - Define diferentes estratégias de processamento de tarefas.
 * Permite alterar o comportamento do processamento sem modificar o código cliente.
 */

export interface TaskData {
  title: string;
  description?: string;
  status?: TaskStatus | string;
  ownerId?: number;
}

export interface ITaskProcessingStrategy {
  /**
   * Processa os dados da tarefa antes de salvar.
   * @param data Dados da tarefa
   * @returns Dados processados
   */
  process(data: TaskData): TaskData;

  /**
   * Valida os dados da tarefa.
   * @param data Dados da tarefa
   * @returns true se válido, false caso contrário
   */
  validate(data: TaskData): { valid: boolean; error?: string };
}

/**
 * Estratégia padrão - Processamento simples sem transformações.
 */
export class DefaultTaskStrategy implements ITaskProcessingStrategy {
  process(data: TaskData): TaskData {
    return {
      ...data,
      title: data.title.trim()
    };
  }

  validate(data: TaskData): { valid: boolean; error?: string } {
    if (!data.title || data.title.trim().length === 0) {
      return { valid: false, error: 'Título é obrigatório' };
    }
    if (data.title.length > 200) {
      return { valid: false, error: 'Título deve ter no máximo 200 caracteres' };
    }
    return { valid: true };
  }
}

/**
 * Estratégia para tarefas administrativas - Validações mais rigorosas.
 */
export class AdminTaskStrategy implements ITaskProcessingStrategy {
  process(data: TaskData): TaskData {
    return {
      ...data,
      title: data.title.trim(),
      description: data.description?.trim() || ''
    };
  }

  validate(data: TaskData): { valid: boolean; error?: string } {
    if (!data.title || data.title.trim().length === 0) {
      return { valid: false, error: 'Título é obrigatório' };
    }
    if (data.title.length < 5) {
      return { valid: false, error: 'Título deve ter pelo menos 5 caracteres' };
    }
    if (data.title.length > 200) {
      return { valid: false, error: 'Título deve ter no máximo 200 caracteres' };
    }
    if (data.description && data.description.length > 1000) {
      return { valid: false, error: 'Descrição deve ter no máximo 1000 caracteres' };
    }
    return { valid: true };
  }
}

/**
 * Estratégia para tarefas prioritárias - Normaliza e valida status.
 */
export class PriorityTaskStrategy implements ITaskProcessingStrategy {
  process(data: TaskData): TaskData {
    return {
      ...data,
      title: data.title.trim().toUpperCase(),
      description: data.description?.trim() || '',
      status: TaskStatus.IN_PROGRESS // Tarefas prioritárias começam em progresso
    };
  }

  validate(data: TaskData): { valid: boolean; error?: string } {
    if (!data.title || data.title.trim().length === 0) {
      return { valid: false, error: 'Título é obrigatório' };
    }
    if (data.title.length < 3) {
      return { valid: false, error: 'Título deve ter pelo menos 3 caracteres' };
    }
    return { valid: true };
  }
}

/**
 * Context que utiliza uma estratégia de processamento.
 * Permite trocar a estratégia em tempo de execução.
 */
export class TaskProcessor {
  private strategy: ITaskProcessingStrategy;

  constructor(strategy: ITaskProcessingStrategy = new DefaultTaskStrategy()) {
    this.strategy = strategy;
  }

  /**
   * Altera a estratégia de processamento.
   */
  setStrategy(strategy: ITaskProcessingStrategy): void {
    this.strategy = strategy;
  }

  /**
   * Processa os dados usando a estratégia atual.
   */
  process(data: TaskData): TaskData {
    return this.strategy.process(data);
  }

  /**
   * Valida os dados usando a estratégia atual.
   */
  validate(data: TaskData): { valid: boolean; error?: string } {
    return this.strategy.validate(data);
  }
}

/**
 * Factory para criar estratégias baseadas no contexto (role do usuário, tipo de tarefa, etc.).
 */
export class TaskStrategyFactory {
  static createStrategy(userRole?: string, taskType?: string): ITaskProcessingStrategy {
    if (userRole === 'ADMIN' || taskType === 'admin') {
      return new AdminTaskStrategy();
    }
    if (taskType === 'priority') {
      return new PriorityTaskStrategy();
    }
    return new DefaultTaskStrategy();
  }
}
