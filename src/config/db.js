const mysql = require('mysql2/promise');
const env = require('./env');
const fs = require('fs');
const path = require('path');

const pool = mysql.createPool({
  host: env.DB_HOST,
  port: env.DB_PORT,
  user: env.DB_USER,
  password: env.DB_PASSWORD,
  database: env.DB_NAME,

  ssl: {
    ca: fs.readFileSync(path.join(__dirname, 'ca.pem'))
  },

  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

module.exports = pool;