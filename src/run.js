const _ = require('lodash');
const chance = require('chance').Chance();
const {
  spawnSync,
} = require('child_process');

const {
  log,
  error,
} = console;

const port = _.random(1e4, 5e4);
const password = [
  chance.word(),
  chance.word(),
  chance.word(),
  chance.d100(),
].join('_');
const algo = 'aes-256-cfb';

const logProc = ({ stderr, stdout }) => {
  log((stdout || '').toString());
  error((stderr || '').toString());
};

const run = async () => {
  const dnf = spawnSync('dnf', ['install', 'shadowsocks-libev', '-y']);
  logProc(dnf);

  const ssServer = spawnSync('ss-server', [
    '-s', 'localhost',
    '-p', port,
    '-k', password,
    '-m', algo,
  ]);
  logProc(ssServer);

  const firewallAddPort = spawnSync('firewall-cmd', [
    '--zone=public',
    '--permanent',
    `--add-port=${port}/tcp`,
  ]);
  logProc(firewallAddPort);

  const firewallReload = spawnSync('firewall-cmd', [
    '--reload',
  ]);
  logProc(firewallReload);

  const iptables = spawnSync('iptables -nL');
  logProc(iptables);
};


run().then(() => log(port, password));
