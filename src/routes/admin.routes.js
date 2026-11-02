const router = require('express').Router();
const db = require('../config/db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { updateSchema, idSchema, listSchema } = require('../utils/schemas');
const { encrypt, decrypt, blindIndex } = require('../utils/crypto');

function safeDecrypt(value) {
  try {
    return decrypt(value);
  } catch {
    return null;
  }
}

// عرض + بحث موحّد: ?page=1&limit=20&q=اسم أو إيميل أو رقم جواز كامل
router.get(
  '/records',
  validate(listSchema, 'query'),
  asyncHandler(async (req, res) => {
    const { page, limit, q } = req.query;
    const where = [];
    const params = [];

    if (q) {
      // اسم/إيميل: بحث جزئي
      const like = '%' + q.replace(/[\\%_]/g, '\\$&') + '%';
      const conds = ['full_name LIKE ?', 'email LIKE ?'];
      params.push(like, like);

      // جواز: الرقم مشفّر، فالبحث بالتطابق الكامل فقط (عبر الهاش)
      const pp = q.replace(/\s+/g, '').toUpperCase();
      if (/^[A-Z0-9]{6,12}$/.test(pp)) {
        conds.push('passport_hash = ?');
        params.push(blindIndex(pp));
      }
      where.push('(' + conds.join(' OR ') + ')');
    }
    const w = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM user_info ${w}`, params);
    const [rows] = await db.query(
      `SELECT id, full_name, email, passport_number, created_at
       FROM user_info ${w} ORDER BY id DESC LIMIT ? OFFSET ?`,
      [...params, limit, (page - 1) * limit]
    );

    res.json({
      page,
      limit,
      total,
      items: rows.map((r) => {
        return {
          id: r.id,
          full_name: r.full_name,
          email: r.email,
          passport_number: safeDecrypt(r.passport_number),
          created_at: r.created_at,
        };
      }),
    });
  })
);

// سجل واحد: رقم الباسبورت كامل
router.get(
  '/records/:id',
  validate(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const [rows] = await db.query(
      'SELECT id, full_name, email, passport_number, created_at FROM user_info WHERE id = ?',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'غير موجود' });
    const r = rows[0];
    res.json({
      id: r.id,
      full_name: r.full_name,
      email: r.email,
      passport_number: safeDecrypt(r.passport_number),
      created_at: r.created_at,
    });
  })
);

// تعديل
router.put(
  '/records/:id',
  validate(idSchema, 'params'),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const b = req.body;
    const fields = [];
    const params = [];

    if (b.full_name !== undefined) { fields.push('full_name = ?'); params.push(b.full_name); }
    if (b.email !== undefined) { fields.push('email = ?'); params.push(b.email); }
    if (b.passport_number !== undefined) {
      fields.push('passport_number = ?', 'passport_hash = ?');
      params.push(encrypt(b.passport_number), blindIndex(b.passport_number));
    }
    params.push(req.params.id);

    const [result] = await db.query(`UPDATE user_info SET ${fields.join(', ')} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'غير موجود' });
    res.json({ message: 'تم التعديل' });
  })
);

// حذف
router.delete(
  '/records/:id',
  validate(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const [result] = await db.query('DELETE FROM user_info WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'غير موجود' });
    res.json({ message: 'تم الحذف' });
  })
);

module.exports = router;
