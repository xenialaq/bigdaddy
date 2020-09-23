const chance = require('chance').Chance();
const { scrambleCaseWord } = require('./util');
const {
  SS_PASSPHRASE_SEP,
} = require('./constants');

module.exports = () => [
  chance.word(),
  chance.word(),
  chance.word(),
  chance.d100().toString(),
]
  .map(scrambleCaseWord)
  .join(SS_PASSPHRASE_SEP);
