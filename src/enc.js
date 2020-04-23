const { publicEncrypt } = require('crypto');
const { readFileSync, existsSync } = require('fs');
const chance = require('chance').Chance();
const yaml = require('js-yaml');

module.exports = (input) => {
  const keyPath = './keys.yaml';
  let keys = [];
  if (existsSync(keyPath)) {
    keys = keys.concat(yaml.safeLoad(readFileSync(keyPath)));
    const key = chance.pickone(keys);
    return publicEncrypt(key, Buffer.from(input, 'utf-8')).toString('hex');
  }
  return null;
};
