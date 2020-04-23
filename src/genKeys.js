require('dotenv').config();
const { generateKeyPairSync } = require('crypto');

module.exports = () => (process.env.passphrase ? generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
    cipher: 'aes-256-cbc',
    passphrase: process.env.passphrase,
  },
}) : null);
