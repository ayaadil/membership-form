const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { loginLimiter } = require('../middleware/rateLimit');
const { loginSchema } = require('../utils/schemas');
const { safeEqual } = require('../utils/crypto');

const isProd = env.NODE_ENV === 'production';

function cookieOptions() {
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict',
    maxAge: 60 * 60 * 1000, // ساعة
    path: '/',
  };
}

router.post(
  '/login',
  loginLimiter, // بيحد عدد محاولات الدخول تلقائياً (8 محاولات كل 15 دقيقة)
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const emailOk = safeEqual(email, env.ADMIN_EMAIL.toLowerCase());
    const passOk = await bcrypt.compare(password, env.ADMIN_PASSWORD_HASH);

    if (!emailOk || !passOk) {
      return res.status(401).json({ error: 'Invalid login credentials' });
    }

    const token = jwt.sign({ role: 'admin' }, env.JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: '1h',
      issuer: 'membership-backend',
    });

    res.cookie('session', token, cookieOptions());
    res.json({ message: 'Logged in successfully' });
  })
);

router.post('/logout', (req, res) => {
  res.clearCookie('session', { ...cookieOptions(), maxAge: undefined });
  res.json({ message: 'Logged out successfully' });
});

router.get('/me', (req, res) => {
  const token = req.cookies && req.cookies.session;
  if (!token) return res.status(401).json({ error: 'Not logged in' });
  try {
    jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'membership-backend' });
    res.json({ email: env.ADMIN_EMAIL });
  } catch {
    res.status(401).json({ error: 'Invalid session' });
  }
});

module.exports = router;
