
import { Router } from 'express';
import passport from 'passport';
import { initAuth, issueToken, requireAuth } from './auth.js';

initAuth();

const router = Router();

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ message: info?.message || 'Credenciais inválidas' });
    const token = issueToken(user);
    return res.json({ token, user });
  })(req, res, next);
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ user: req.user });
});

export default router;
