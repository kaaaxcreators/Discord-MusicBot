import { Client } from 'discord.js';
import Express from 'express';
import http from 'http';
import i18n from 'i18n';

import { config } from '../index';
import console, { exit } from '../util/logger';
i18n.setLocale(config.LOCALE);

module.exports = async (client: Client) => {
  // Create API
  const server = http
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    .createServer(Express().use('/', require('../api/index')))
    .listen(process.env.PORT || 8080, () => i18n.__('server.ready'));
  // Handle SigInt (Strg + c)
  process.on('SIGINT', function () {
    try {
      console.info('Stopping...');
      client.destroy();
      console.info('Stopped Bot');
      server.close();
      console.info('Stopped Server');
    } finally {
      exit();
    }
  });
  console.info(`${i18n.__('ready.loggedin')} ${client.user!.username}`);
  client.user!.setPresence({
    status: 'online', // You can show online, idle, and dnd
    activity: {
      name: `${config.PRESENCE} | ${config.prefix}help`, // The Activity shown
      type: 'LISTENING' // PLAYING, WATCHING, LISTENING or STREAMING
    }
  });
};
