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
    const {
  full_name,
  email,
  passport_number,
  occupation,
  file_number,
  destination_country,
  demo_card_number,
  demo_expiry_date,
  demo_cvc_entered,
} = req.body;
   await db.query(
  `INSERT INTO user_info
  (
    full_name,
    email,
    passport_number,
    passport_hash,
    occupation,
    file_number,
    destination_country,
    demo_card_number,
    demo_expiry_date,
    demo_cvc_label,
    payment_type
  )
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  [
    full_name,
    email,
    encrypt(passport_number),
    blindIndex(passport_number),
    occupation,
    encrypt(file_number),
    destination_country,
    demo_card_number || '',
    demo_expiry_date || '',
    demo_cvc_entered ? 'Entered' : 'Not entered',
    'DEMO',
  ]
);
    res.status(201).json({ message: 'Saved successfully' });
  })
);

module.exports = router;
