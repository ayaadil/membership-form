const path = require('path');
const env = require('./src/config/env');
const express = require('express');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const db = require('./src/config/db');
const requireAdmin = require('./src/middleware/auth');
const csrfCheck = require('./src/middleware/csrf');
const errorHandler = require('./src/middleware/errorHandler');
const { globalLimiter, adminLimiter } = require('./src/middleware/rateLimit');

const app = express();
const isProd = env.NODE_ENV === 'production';

app.disable('x-powered-by');
app.set('trust proxy', 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        // على http (تطوير/localhost) بيكسر تحميل الـ JS/CSS بمتصفحات مثل Safari
        upgradeInsecureRequests: isProd ? [] : null,
      },
    },
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use('/api', globalLimiter);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// الفورمة العامة (مفتوحة لأي زائر)
app.use('/api', require('./src/routes/submit.routes'));

// تسجيل دخول لوحة الإدارة
app.use('/api/auth', require('./src/routes/auth.routes'));

// لوحة الإدارة: عرض وبحث وتعديل وحذف الطلبات
app.use('/api/admin', adminLimiter, requireAdmin, csrfCheck, require('./src/routes/admin.routes'));

// رابط مختصر وسهل التذكر للوصول للوحة الإدارة: /admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin-login.html'));
});

// صفحات الموقع
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res) => res.status(404).json({ error: 'غير موجود' }));
app.use(errorHandler);

(async () => {
  try {
    await db.query('SELECT 1');
    app.listen(env.PORT, () => console.log(`Server running on port ${env.PORT}`));
  } catch (err) {
    console.error('Database connection failed:', err.code || err.message);
    process.exit(1);
  }
})();
