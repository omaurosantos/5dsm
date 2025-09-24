import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

async function main() {
  const users = [
    { username: 'admin',   name: 'Admin',   role: 'ADMIN',   password: 'admin123' },
    { username: 'gerente', name: 'Gerente', role: 'MANAGER', password: 'gerente123' },
    { username: 'visu',    name: 'Viewer',  role: 'VIEWER',  password: 'visu123' },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { username: u.username },
      update: { name: u.name, role: u.role as any, passwordHash: hash },
      create: { username: u.username, name: u.name, role: u.role as any, passwordHash: hash },
    });
  }

  const count = await prisma.task.count();
  if (count === 0) {
    await prisma.task.create({ data: { title: 'Estudar TypeScript', description: 'Revisar generics', status: 'pending' } });
    await prisma.task.create({ data: { title: 'Criar API To-Do', description: 'CRUD com Prisma + Swagger', status: 'done' } });
  }
  console.log('Seed concluído.');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
// --- IGNORE ---