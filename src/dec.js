require('dotenv').config();
const { privateDecrypt } = require('crypto');
const { readFileSync, existsSync } = require('fs');

module.exports = (input) => {
  const keyPath = './key.pkf';
  if (existsSync(keyPath)) {
    return privateDecrypt({
      key: readFileSync(keyPath),
      passphrase: process.env.passphrase,
    }, Buffer.from(input, 'hex')).toString();
  }
  return null;
};
