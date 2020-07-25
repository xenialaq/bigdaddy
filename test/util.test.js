const { scrambleCaseChar, scrambleCaseWord } = require('../src/util');

test('scrambleCaseChar accepts single char', () => {
  expect(scrambleCaseChar('a')).toMatch(/^a$/i);
});

test('scrambleCaseChar accepts single numeric char', () => {
  expect(scrambleCaseChar('3')).toBe('3');
});

test('scrambleCaseChar rejects multiple chars', () => {
  expect(() => scrambleCaseChar('23')).toThrow();
});

test('scrambleCaseChar rejects null or undefined', () => {
  expect(() => scrambleCaseChar()).toThrow();
  expect(() => scrambleCaseChar(null)).toThrow();
});

test('scrambleCaseWord accepts example strings', () => {
  expect(scrambleCaseWord('')).toBe('');
  expect(scrambleCaseWord('a')).toMatch(/^a$/i);
  expect(scrambleCaseWord('a_Bc_d_34')).toMatch(/^abcd34$/i);
});

test('scrambleCaseWord rejects non string inputs', () => {
  expect(() => scrambleCaseWord()).toThrow();
  expect(() => scrambleCaseWord([])).toThrow();
  expect(() => scrambleCaseWord({})).toThrow();
  expect(() => scrambleCaseWord(1)).toThrow();
  expect(() => scrambleCaseWord(null)).toThrow();
});

test('scrambleCaseChar likelihood', () => {
  let countUp = 0;
  let countLw = 0;
  const a = 'a';
  for (let i = 0; i < 100; i += 1) {
    const r = scrambleCaseWord(a);
    if (r === 'A') countUp += 1;
    if (r === 'a') countLw += 1;
  }
  expect(countUp).toBeGreaterThan(0);
  expect(countUp).toBeLessThanOrEqual(30);
  expect(countUp + countLw).toBe(100);
});
