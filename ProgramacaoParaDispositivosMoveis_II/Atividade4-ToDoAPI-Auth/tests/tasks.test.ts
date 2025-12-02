import request from "supertest";
import { describe, expect, it, beforeEach } from "vitest";
import { TaskStatus } from "@prisma/client";
import { app } from "../src/app.js";
import { ITaskRepository, TaskRepositoryFactory } from "../src/adapters/TaskRepositoryAdapter.js";

class InMemoryTaskRepository implements ITaskRepository {
  private tasks: any[];

  constructor(seed?: any[]) {
    this.tasks = seed ? [...seed] : [];
  }

  async findAll() {
    return [...this.tasks];
  }

  async findById(id: number) {
    return this.tasks.find((t) => t.id === id) || null;
  }

  async create(data: { title: string; description?: string; status?: TaskStatus; ownerId?: number; }) {
    const nextId = this.tasks.length ? Math.max(...this.tasks.map((t) => t.id)) + 1 : 1;
    const task = {
      id: nextId,
      title: data.title,
      description: data.description ?? null,
      status: data.status || TaskStatus.TO_DO,
      ownerId: data.ownerId ?? null,
    };
    this.tasks.push(task);
    return task;
  }

  async update(id: number, data: Partial<{ title: string; description?: string; status: TaskStatus; }>) {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;
    Object.assign(task, data);
    return task;
  }

  async delete(id: number) {
    const before = this.tasks.length;
    this.tasks = this.tasks.filter((t) => t.id !== id);
    return this.tasks.length < before;
  }
}

const seedTasks = [
  { id: 1, title: "Primeira tarefa", description: "Detalhes", status: TaskStatus.TO_DO },
  { id: 2, title: "Segunda tarefa", description: null, status: TaskStatus.DONE }
];

describe("Task routes", () => {
  beforeEach(() => {
    TaskRepositoryFactory.setRepository(new InMemoryTaskRepository(seedTasks));
  });

  it("returns seeded tasks", async () => {
    const response = await request(app).get("/api/tasks").expect(200);
    expect(response.body).toHaveLength(2);
    expect(response.body[0]).toMatchObject({ title: "Primeira tarefa" });
  });

  it("creates a task when authenticated", async () => {
    const payload = { title: "Nova tarefa", description: "Algo", status: TaskStatus.IN_PROGRESS };
    const response = await request(app)
      .post("/api/tasks")
      .send(payload)
      .expect(201);

    expect(response.body).toMatchObject({
      title: "Nova tarefa",
      description: "Algo",
      status: TaskStatus.IN_PROGRESS,
      ownerId: 1
    });

    const list = await request(app).get("/api/tasks");
    expect(list.body).toHaveLength(3);
  });

  it("updates an existing task", async () => {
    const response = await request(app)
      .put("/api/tasks/1")
      .send({ status: TaskStatus.DONE })
      .expect(200);

    expect(response.body).toMatchObject({ id: 1, status: TaskStatus.DONE });
  });
});
