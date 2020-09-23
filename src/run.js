const _ = require('lodash');
const { appendFileSync, openSync } = require('fs');
const { spawnSync, spawn } = require('child_process');
const debug = require('debug');
const Promise = require('bluebird');
const enc = require('./enc');
const genPass = require('./genPass');
const {
  SS_ALGO, SS_PORT_START, SS_PORT_END, SS_LOG_PATH,
} = require('./constants');

const { log } = console;

const port = _.random(SS_PORT_START, SS_PORT_END).toString();

const password = genPass();

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
  const ssServer = spawn('su', ['-c', ['ss-server', ...serverArgs].join(' '), 'circleci'], {
    detached: true,
    stdio: ['ignore', out, err],
  });
  ssServer.unref();

  await Promise.delay(5e3);

  const firewallListPort = spawnSync('firewall-cmd', [
    '--zone=public',
    '--list-ports',
  ]);
  logProc(firewallListPort);
  const portsToClose = firewallListPort.stdout.toString().split(/\s/).filter((portProtocol) => {
    const match = portProtocol.match(/^(\d+)\/tcp$/);
    if (!match) {
      return false;
    }
    const portToClose = parseInt(match[1], 10);
    return portToClose >= SS_PORT_START && portToClose <= SS_PORT_END;
  });

  for (let i = 0; i < portsToClose.length; i += 1) {
    const portToClose = portsToClose[i];
    const firewallRemovePort = spawnSync('firewall-cmd', [
      '--zone=public',
      '--permanent',
      `--remove-port=${portToClose}`,
    ]);
    logProc(firewallRemovePort);
  }

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
