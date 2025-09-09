
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

type User = { id: number; username: string; passwordHash: string; name?: string };

function loadUsers(): User[] {
  const file = path.resolve(__dirname, '../data/users.json');
  if (!fs.existsSync(file)) return [];
  return JSON.parse(fs.readFileSync(file, 'utf-8')) as User[];
}

const users = loadUsers();
const findUser = (username: string) => users.find(u => u.username === username);

export function initAuth() {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = findUser(username);
      if (!user) return done(null, false, { message: 'Usuário não encontrado' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: 'Senha inválida' });
      return done(null, { id: user.id, username: user.username, name: user.name });
    } catch (err) {
      return done(err);
    }
  }));

  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  }, (payload: any, done) => {
    const user = users.find(u => u.id === payload.sub);
    if (!user) return done(null, false);
    return done(null, { id: user.id, username: user.username, name: user.name });
  }));
}

export function issueToken(user: { id: number; username: string; name?: string }) {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(
    { sub: user.id, username: user.username, name: user.name },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

export const requireAuth: RequestHandler = passport.authenticate('jwt', { session: false });
export const usePassport: RequestHandler = passport.initialize();
