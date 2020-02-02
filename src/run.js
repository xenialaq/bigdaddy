const _ = require('lodash');
const chance = require('chance').Chance();
const {
  spawnSync, spawn,
} = require('child_process');
const { appendFileSync } = require('fs');
const Promise = require('bluebird');
const debug = require('debug');

const port = _.random(1e4, 5e4).toString();
const password = [
  chance.word(),
  chance.word(),
  chance.word(),
  chance.d100(),
].join('_');
const algo = 'aes-256-cfb';

const logProc = ({ stderr, stdout }) => {
  if (stderr) debug('E')(stderr.toString());
  if (stdout) debug('D')(stdout.toString());
};

const logFile = (line) => appendFileSync('ss.log', line);

const run = async () => {
  const dnfPlugin = spawnSync('dnf', ['install', 'dnf-command(copr)', '-y']);
  logProc(dnfPlugin);

  const dnfRepo = spawnSync('dnf', ['copr', 'enable', 'librehat/shadowsocks', '-y']);
  logProc(dnfRepo);

  const dnfInstall = spawnSync('dnf', ['install', 'shadowsocks-libev', '-y']);
  logProc(dnfInstall);

  const pkill = spawnSync('pkill', ['-f', 'ss-server']);
  logProc(pkill);

  const ipr = spawnSync('ip', ['r']);
  const serverIp = _.last(
    ipr.stdout.toString().split('\n').filter((l) => l.indexOf('dev eth0 proto kernel') > -1)[0].split(' '),
  );

  const serverArgs = [
    '-s', serverIp,
    '-p', port,
    '-k', password,
    '-m', algo,
  ];
  const ssServer = spawn('ss-server', serverArgs);
  ssServer.stdout.on('data', (data) => {
    logFile(data);
  });
  ssServer.stderr.on('data', (data) => {
    logFile(data);
  });
  ssServer.on('close', (code) => {
    logFile(`ss process exited with code ${code}`);
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


run().then(() => logFile(`${port} ${password}`));
