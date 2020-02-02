const _ = require('lodash');
const chance = require('chance').Chance();
const {
  spawnSync, spawn,
} = require('child_process');
const Promise = require('bluebird');

const {
  log, error,
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
  error((stderr || '').toString());
  log((stdout || '').toString());
};

const run = async () => {
  const dnfPlugin = spawnSync('dnf', ['install', 'dnf-command(copr)', '-y']);
  logProc(dnfPlugin);

  const dnfRepo = spawnSync('dnf', ['copr', 'enable', 'librehat/shadowsocks', '-y']);
  logProc(dnfRepo);

  const dnfInstall = spawnSync('dnf', ['install', 'shadowsocks-libev', '-y']);
  logProc(dnfInstall);

  const ipr = spawnSync('ip', ['r']);
  const serverIp = ipr.stdout.toString().split('\n').filter((l) => l.indexOf('default') > -1)[0].replace(/[^0-9.]/g, '');

  const serverArgs = [
    '-s', serverIp,
    '-p', port,
    '-k', password,
    '-m', algo,
  ];
  log(serverArgs);
  const ssServer = spawn('ss-server', serverArgs);

  ssServer.stdout.on('data', (data) => {
    log(`ss: ${data}`);
  });
  ssServer.stderr.on('data', (data) => {
    error(`ss: ${data}`);
  });
  ssServer.on('close', (code) => {
    log(`ss process exited with code ${code}`);
  });

  await Promise.delay(5e3);

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

  const iptables = spawnSync('iptables', ['-nL']);
  logProc(iptables);
};


run().then(() => log(port, password));
