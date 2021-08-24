import { ApplicationCommandData, Client } from 'discord.js';
import Express from 'express';
import handlebars from 'express-handlebars';
import http from 'http';
import i18next from 'i18next';
import { join } from 'path';
import { Server } from 'socket.io';

import { commands, config } from '../index';
import helpers from '../util/helpers';
import console from '../util/logger';

module.exports = async (client: Client) => {
  let server: http.Server;
  if (!config.DISABLEWEB) {
    // Create API
    server = Express()
      .use('/', (await import('../api/index')).default)
      .set('view engine', 'hbs')
      .set('views', join(__dirname, '../../views/'))
      .engine(
        'hbs',
        handlebars({
          layoutsDir: join(__dirname + '../../../views/layout/'),
          defaultLayout: 'index',
          extname: 'hbs',
          helpers: helpers,
          partialsDir: join(__dirname + '../../../views/partials/')
        })
      )
      .listen(process.env.PORT || 8080, () => console.info(i18next.t('server.ready')));
    (await import('../api/socket')).default(new Server(server));
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
      process.exit();
    }
  });
  console.info(`${i18next.t('ready.loggedin')} ${client.user!.username}`);
  client.user?.setPresence({
    status: 'online',
    activities: [{ name: `${config.PRESENCE} | ${config.prefix}help`, type: config.PRESENCETYPE }]
  });
  // Set Slash Commands
  // Setup Interactions
  const interactions = commands
    .filter((v) => !!v.interaction?.run && !v.info.hidden)
    .map(
      (v) =>
        ({
          name: v.info.name,
          description: v.info.description,
          options: v.interaction?.options
        } as ApplicationCommandData)
    );
  // If Slash Commands are enabled and Debug GUILD Id is not present
  if (config.SLASHCOMMANDS && !process.env.GUILDID) {
    client.application?.commands.set(interactions);
  } else {
    client.guilds.cache.get(process.env.GUILDID!)?.commands.set(interactions);
  }
};
