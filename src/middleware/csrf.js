// حماية بسيطة من CSRF لطلبات تغيير البيانات (POST/PUT/DELETE):
// بما إنّ الجلسة محفوظة بـ cookie مع SameSite=Strict، والطلب لازم يحمل
// هيدر مخصص ما بيقدر أي موقع خارجي يضيفه من فورمة عادية.
module.exports = function csrfCheck(req, res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('x-requested-with') !== 'membership-admin') {
    return res.status(403).json({ error: 'طلب مرفوض' });
  }
  next();
};
