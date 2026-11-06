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
  `SELECT
    id,
    full_name,
    email,
    passport_number,
    occupation,
    file_number,
    destination_country,
    demo_card_number,
    demo_expiry_date,
    demo_cvc_label,
    payment_type,
    created_at
   FROM user_info
   ${w}
   ORDER BY id DESC
   LIMIT ? OFFSET ?`,
  [...params, limit, (page - 1) * limit]
);


res.json({
  page, limit, total,
  items: rows.map((r) => ({
    id: r.id,
    full_name: r.full_name,
    email: r.email,
    passport_number: safeDecrypt(r.passport_number),
    occupation: r.occupation,
    file_number: safeDecrypt(r.file_number),
    destination_country: r.destination_country,
    demo_card_number: r.demo_card_number,
    demo_expiry_date: r.demo_expiry_date,
    demo_cvc_label: r.demo_cvc_label,
    payment_type: r.payment_type,
    created_at: r.created_at,
  })),
});
  })
);

// سجل واحد: رقم الباسبورت كامل
router.get(
  '/records/:id',
  validate(idSchema, 'params'),
  asyncHandler(async (req, res) => {
   const [rows] = await db.query(
  `SELECT
    id,
    full_name,
    email,
    passport_number,
    occupation,
    file_number,
    destination_country,
    demo_card_number,
    demo_expiry_date,
    demo_cvc_label,
    payment_type,
    created_at
   FROM user_info
   WHERE id = ?`,
  [req.params.id]
);
if (!rows.length) return res.status(404).json({ error: 'not found' });
const r = rows[0];
res.json({
  id: r.id, full_name: r.full_name, email: r.email,
  passport_number: safeDecrypt(r.passport_number),
  occupation: r.occupation,
  file_number: safeDecrypt(r.file_number),
  destination_country: r.destination_country,
  demo_card_number: r.demo_card_number,
  demo_expiry_date: r.demo_expiry_date,
  demo_cvc_label: r.demo_cvc_label,
  payment_type: r.payment_type,
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
    if (b.occupation !== undefined) { fields.push('occupation = ?'); params.push(b.occupation); }
    if (b.file_number !== undefined) { fields.push('file_number = ?'); params.push(encrypt(b.file_number)); }
    if (b.destination_country !== undefined) { fields.push('destination_country = ?'); params.push(b.destination_country); }
    params.push(req.params.id);

    const [result] = await db.query(`UPDATE user_info SET ${fields.join(', ')} WHERE id = ?`, params);
    if (!result.affectedRows) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'updated' });
  })
);

// حذف
router.delete(
  '/records/:id',
  validate(idSchema, 'params'),
  asyncHandler(async (req, res) => {
    const [result] = await db.query('DELETE FROM user_info WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ error: 'not found' });
    res.json({ message: 'deleted' });
  })
);

module.exports = router;
