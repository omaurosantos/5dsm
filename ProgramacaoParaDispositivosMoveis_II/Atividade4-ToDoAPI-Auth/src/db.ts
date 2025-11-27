import { PrismaClient } from '@prisma/client';

/**
 * Singleton Pattern - Garante uma única instância do PrismaClient
 * em toda a aplicação, evitando múltiplas conexões ao banco de dados.
 */
class DatabaseSingleton {
  private static instance: PrismaClient | null = null;

  /**
   * Retorna a instância única do PrismaClient.
   * Se não existir, cria uma nova instância.
   */
  public static getInstance(): PrismaClient {
    if (!DatabaseSingleton.instance) {
      DatabaseSingleton.instance = new PrismaClient();
    }
    return DatabaseSingleton.instance;
  }

  /**
   * Permite desconectar explicitamente (útil para testes ou shutdown graceful).
   */
  public static async disconnect(): Promise<void> {
    if (DatabaseSingleton.instance) {
      await DatabaseSingleton.instance.$disconnect();
      DatabaseSingleton.instance = null;
    }
  }
}

export const prisma = DatabaseSingleton.getInstance();
