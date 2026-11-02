const crypto = require('crypto');
const env = require('../config/env');

const ENC_KEY = Buffer.from(env.ENCRYPTION_KEY, 'hex');
const HASH_KEY = Buffer.from(env.HASH_KEY, 'hex');

function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENC_KEY, iv);
  const enc = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), enc]).toString('base64');
}

function decrypt(data) {
  const buf = Buffer.from(data, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENC_KEY, buf.subarray(0, 12));
  decipher.setAuthTag(buf.subarray(12, 28));
  return Buffer.concat([decipher.update(buf.subarray(28)), decipher.final()]).toString('utf8');
}

function blindIndex(value) {
  return crypto.createHmac('sha256', HASH_KEY).update(value).digest('hex');
}

function mask(value) {
  return '*'.repeat(Math.max(value.length - 3, 0)) + value.slice(-3);
}

function safeEqual(a, b) {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

module.exports = { encrypt, decrypt, blindIndex, mask, safeEqual };
