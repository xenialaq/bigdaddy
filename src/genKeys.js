require('dotenv').config();
const { generateKeyPairSync } = require('crypto');
const {
  BD_KEY_FORMAT,
  BD_PRIVATE_KEY_CIPHER,
  BD_PRIVATE_KEY_TYPE,
  BD_PUB_KEY_TYPE,
} = require('./constants');

module.exports = () => (process.env.passphrase ? generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    format: BD_KEY_FORMAT,
    type: BD_PUB_KEY_TYPE,
  },
  privateKeyEncoding: {
    cipher: BD_PRIVATE_KEY_CIPHER,
    format: BD_KEY_FORMAT,
    passphrase: process.env.passphrase,
    type: BD_PRIVATE_KEY_TYPE,
  },
}) : null);
