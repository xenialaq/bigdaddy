const _ = require('lodash');
const chance = require('chance').Chance();

const scrambleCaseChar = (c) => {
  if (!_.isString(c) || c.length !== 1) throw new Error('A single char string is required.');
  return chance.bool({ likelihood: chance.d30() })
    ? _.upperCase(c)
    : _.lowerCase(c);
};

const scrambleCaseWord = (word) => word.split('').map(scrambleCaseChar).join('');

module.exports = { scrambleCaseChar, scrambleCaseWord };
