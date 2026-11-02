const router = require('express').Router();
const db = require('../config/db');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { submitLimiter } = require('../middleware/rateLimit');
const { createSchema } = require('../utils/schemas');
const { encrypt, blindIndex } = require('../utils/crypto');

// الفورمة العامة: إدخال فقط
router.post(
  '/submit',
  submitLimiter,
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const { full_name, email, passport_number } = req.body;
    await db.query(
      'INSERT INTO user_info (full_name, email, passport_number, passport_hash) VALUES (?, ?, ?, ?)',
      [full_name, email, encrypt(passport_number), blindIndex(passport_number)]
    );
    res.status(201).json({ message: 'Saved successfully' });
  })
);

module.exports = router;
