const _ = require('lodash');
const { appendFileSync, openSync } = require('fs');
const { spawnSync, spawn } = require('child_process');
const chance = require('chance').Chance();
const debug = require('debug');
const Promise = require('bluebird');
const enc = require('./enc');

const { log } = console;

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
    ipr.stdout.toString().split('\n').filter((l) => l.indexOf('dev eth0 proto kernel') > -1)[0].trim().split(' '),
  );

  const serverArgs = [
    '-s', serverIp,
    '-p', port,
    '-k', password,
    '-m', algo,
  ];
  const out = openSync('./ss.log', 'a');
  const err = openSync('./ss.log', 'a');
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
