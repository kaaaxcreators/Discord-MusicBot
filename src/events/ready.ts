import { Client } from 'discord.js';
import Express from 'express';
import http from 'http';
import i18next from 'i18next';
import { Server } from 'socket.io';

import { config } from '../index';
import console, { exit } from '../util/logger';

module.exports = async (client: Client) => {
  let server: http.Server;
  if (!config.DISABLEWEB) {
    // Create API
    server = Express()
      .use('/', (await import('../api/index')).default)
      .listen(process.env.PORT || 8080, () => console.info(i18next.t('server.ready')));
    (await import('../api/socket/index')).default(new Server(server));
  }
  // Handle SigInt (Strg + c)
  process.on('SIGINT', function () {
    try {
      console.info('Stopping...');
      client.destroy();
      console.info('Stopped Bot');
      if (!config.DISABLEWEB) {
        server.close();
        console.info('Stopped Server');
      }
    } finally {
      exit();
    }
  });
  console.info(`${i18next.t('ready.loggedin')} ${client.user!.username}`);
  client.user!.setPresence({
    status: 'online', // You can show online, idle, and dnd
    activity: {
      name: `${config.PRESENCE} | ${config.prefix}help`, // The Activity shown
      type: config.PRESENCETYPE
    }
  });
};
