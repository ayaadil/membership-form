const rateLimit = require('express-rate-limit');

const make = (windowMs, limit, error, extra = {}) =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error },
    ...extra,
  });

const MIN = 60 * 1000;

module.exports = {
  globalLimiter: make(15 * MIN, 200, 'too many requests, try again later'),
  submitLimiter: make(15 * MIN, 10, 'too many submission attempts, try again later'),
  loginLimiter: make(15 * MIN, 8, 'too many login attempts, try again in 15 minutes'),
  adminLimiter: make(15 * MIN, 300, 'too many requests, try again later'),
};
