const { writeFileSync, appendFileSync } = require('fs');
const prompts = require('prompts');
const dec = require('./dec');
const enc = require('./enc');
const genKeys = require('./genKeys');
const genPass = require('./genPass');
const {
  BD_PRIVATE_KEY_PATH, BD_PUB_KEY_PATH,
} = require('./constants');

const { log } = console;
(async () => {
  const { value } = await prompts({
    type: 'select',
    name: 'value',
    message: 'Choose a task',
    choices: [
      { title: 'Passphrase' },
      { title: 'Keys' },
      { title: 'Encrypt' },
      { title: 'Decrypt' },
    ],
  });
  if (value === 0) {
    log(genPass());
  } else if (value === 1) {
    const { publicKey, privateKey } = genKeys();
    appendFileSync(BD_PUB_KEY_PATH, `- |\n${publicKey.trim().split('\n').map((line) => `  ${line}`).join('\n')}\n`);
    writeFileSync(BD_PRIVATE_KEY_PATH, privateKey);
  } else if (value === 2) {
    const { input } = await prompts({
      name: 'input',
      type: 'text',
      message: 'Input',
    });
    log(enc(input));
  } else if (value === 3) {
    const { input } = await prompts({
      name: 'input',
      type: 'text',
      message: 'Input',
    });
    log(dec(input));
  }
})();
