// يملأ passport_hash للسجلات القديمة (اللي انحفظت قبل إضافة العمود)
// عشان البحث برقم الجواز في لوحة الإدارة يلاقيها. آمن للتشغيل أكثر من مرة.
const db = require('../src/config/db');
const { decrypt, blindIndex } = require('../src/utils/crypto');

(async () => {
  const [rows] = await db.query('SELECT id, passport_number FROM user_info WHERE passport_hash IS NULL');
  let done = 0, failed = 0, dup = 0;
  for (const r of rows) {
    try {
      const hash = blindIndex(decrypt(r.passport_number));
      await db.query('UPDATE user_info SET passport_hash = ? WHERE id = ?', [hash, r.id]);
      done++;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') dup++; // نفس الجواز مسجّل بسجل ثاني
      else failed++;
      console.warn(`skip id=${r.id}:`, err.code || err.message);
    }
  }
  console.log(`updated: ${done}, duplicates: ${dup}, failed: ${failed}, total checked: ${rows.length}`);
  await db.end();
})().catch((e) => { console.error(e.message); process.exit(1); });
