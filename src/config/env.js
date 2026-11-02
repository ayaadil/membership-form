require('dotenv').config();
const { z } = require('zod');

const hex64 = z.string().regex(/^[0-9a-fA-F]{64}$/, 'must be 64 hex chars');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),

  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(3306),
  DB_USER: z.string().min(1),
  DB_PASSWORD: z.string().default(''),
  DB_NAME: z.string().min(1),

  ENCRYPTION_KEY: hex64,
  HASH_KEY: hex64,
  JWT_SECRET: z.string().min(32),

  // باسوورد واحد مشترك لكل من بده يشوف لوحة الإدارة
  ADMIN_EMAIL: z.string().email(),
  ADMIN_PASSWORD_HASH: z.string().min(50),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error(
    'Invalid/missing environment variables:',
    parsed.error.issues.map((i) => i.path.join('.')).join(', ')
  );
  process.exit(1);
}
module.exports = parsed.data;
