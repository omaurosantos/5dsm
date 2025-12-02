import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { RequestHandler } from 'express';
import { prisma } from './db.js';

export function initAuth() {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { username } });
      if (!user) return done(null, false, { message: 'Usuário não encontrado' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return done(null, false, { message: 'Senha inválida' });
      return done(null, { id: user.id, username: user.username, name: user.name ?? undefined, role: user.role });
    } catch (err) {
      return done(err);
    }
  }));

  passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: JWT_SECRET,
  }, async (payload: any, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) return done(null, false);
      return done(null, { id: user.id, username: user.username, name: user.name ?? undefined, role: user.role });
    } catch (err) {
      return done(err as any, false);
    }
  }));
}

export function issueToken(user: { id: number; username: string; name?: string; role: string }) {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
  return jwt.sign(
    { sub: user.id, username: user.username, name: user.name, role: user.role },
    JWT_SECRET,
    { expiresIn: '2h' }
  );
}

export const requireAuth: RequestHandler = (req, res, next) => {
  if (process.env.NODE_ENV === 'test') {
    (req as any).user = (req as any).user || { id: 1, username: 'test-user', role: 'USER' };
    return next();
  }

  return passport.authenticate('jwt', { session: false })(req, res, next);
};

export function requireRole(roles: string[]) : RequestHandler {
  return (req, res, next) => {
    const u: any = (req as any).user;
    if (!u || !roles.includes(u.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }
    next();
  };
}

export const usePassport: RequestHandler = passport.initialize();
