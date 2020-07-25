const _ = require('lodash');
const { appendFileSync, openSync } = require('fs');
const { spawnSync, spawn } = require('child_process');
const chance = require('chance').Chance();
const debug = require('debug');
const Promise = require('bluebird');
const enc = require('./enc');
const { scrambleCaseWord } = require('./util');
const {
  SS_ALGO, SS_PORT_START, SS_PORT_END, SS_PASSPHRASE_SEP, SS_LOG_PATH,
} = require('./constants');

const { log } = console;

const port = _.random(SS_PORT_START, SS_PORT_END).toString();

const password = [
  chance.word(),
  chance.word(),
  chance.word(),
  chance.d100().toString(),
]
  .map(scrambleCaseWord)
  .join(SS_PASSPHRASE_SEP);

const algo = SS_ALGO;

const logProc = ({ stderr, stdout }) => {
  if (stderr) debug('E')(stderr.toString());
  if (stdout) debug('D')(stdout.toString());
};

const logFile = (line) => appendFileSync(SS_LOG_PATH, line);

const run = async () => {
  const yumEpel = spawnSync('yum', ['install', 'epel-release', '-y']);
  logProc(yumEpel);

  const dnfPlugin = spawnSync('dnf', ['install', 'dnf-command(copr)', '-y']);
  logProc(dnfPlugin);

  const dnfRepo = spawnSync('dnf', ['copr', 'enable', 'librehat/shadowsocks', '-y']);
  logProc(dnfRepo);

  const dnfInstall = spawnSync('dnf', ['install', 'shadowsocks-libev', '-y']);
  logProc(dnfInstall);

  const pkill = spawnSync('pkill', ['-f', 'ss-server']);
  logProc(pkill);

  const ipr = spawnSync('ip', ['r']);
  const ipFilter = (s) => s.match(/^\d+.\d+.\d+.\d+$/);
  const serverIp = _.last(
    ipr.stdout.toString().split('\n').filter((l) => l.indexOf('dev eth0 proto kernel') > -1)[0].trim().split(' ').filter(ipFilter),
  );

  const serverArgs = [
    '-s', serverIp,
    '-p', port,
    '-k', password,
    '-m', algo,
  ];
  const out = openSync(SS_LOG_PATH, 'a');
  const err = openSync(SS_LOG_PATH, 'a');
  const ssServer = spawn('ss-server', serverArgs, {
    detached: true,
    stdio: ['ignore', out, err],
  });
  ssServer.unref();

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

  const configInfo = `${serverIp} ${port} ${password} ${algo}`;
  logFile(configInfo);

  log(enc(configInfo));
};

run();
