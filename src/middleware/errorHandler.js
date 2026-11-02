module.exports = (err, req, res, next) => {
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ error: 'هذه البيانات مسجّلة مسبقاً' });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'JSON غير صالح' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'الطلب كبير جداً' });
  }
  console.error('[error]', err.code || '', err.message);
  res.status(500).json({ error: 'خطأ داخلي بالسيرفر' });
};
