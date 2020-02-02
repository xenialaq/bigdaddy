const _ = require('lodash');
const chance = require('chance').Chance();
const {
  spawn,
} = require('child_process');
const {
  promisify,
} = require('util');

const port = _.random(1e4, 5e4);
const password = [
  chance.word(),
  chance.word(),
  chance.word(),
  chance.d100(),
].join('_');
const algo = 'aes-256-cfb';

const run = async () => {
  const exec = promisify(spawn);

  await exec('dnf', ['install', 'shadowsocks-libev', '-y']);

  await exec('ss-server', [
    '-s', 'localhost',
    '-p', port,
    '-k', password,
    '-m', algo,
  ]);

  await exec('ss-server', [
    '-s', 'localhost',
    '-p', port,
    '-k', password,
    '-m', algo,
  ]);

  await exec('firewall-cmd', [
    '--zone=public',
    '--permanent',
    `--add-port=${port}/tcp`,
  ]);

  await exec('firewall-cmd', [
    '--reload',
  ]);

  await exec('iptables -nL');
};


const { log } = console;
run().then(() => log(port, password));
