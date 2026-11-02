const c = require('crypto');
console.log('ENCRYPTION_KEY=' + c.randomBytes(32).toString('hex'));
console.log('HASH_KEY=' + c.randomBytes(32).toString('hex'));
console.log('JWT_SECRET=' + c.randomBytes(48).toString('hex'));
