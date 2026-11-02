const bcrypt = require('bcrypt');
const pw = process.argv[2];
if (!pw || pw.length < 12) {
  console.error('Usage: npm run hash -- "password with 12 characters or more"');
  process.exit(1);
}
bcrypt.hash(pw, 12).then((h) => console.log("ADMIN_PASSWORD_HASH='" + h + "'"));
