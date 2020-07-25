require('dotenv').config();
const { privateDecrypt } = require('crypto');
const { readFileSync, existsSync } = require('fs');
const { BD_PRIVATE_KEY_PATH } = require('./constants');

module.exports = (input) => {
  if (existsSync(BD_PRIVATE_KEY_PATH)) {
    return privateDecrypt({
      key: readFileSync(BD_PRIVATE_KEY_PATH),
      passphrase: process.env.passphrase,
    }, Buffer.from(input, 'hex')).toString();
  }
  return null;
};
