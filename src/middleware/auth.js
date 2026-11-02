const jwt = require('jsonwebtoken');
const env = require('../config/env');

module.exports = function requireAdmin(req, res, next) {
  const token = req.cookies && req.cookies.session;
  if (!token) return res.status(401).json({ error: 'غير مصرّح' });
  try {
    jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'], issuer: 'membership-backend' });
    next();
  } catch {
    res.status(401).json({ error: 'الجلسة غير صالحة أو منتهية' });
  }
};
