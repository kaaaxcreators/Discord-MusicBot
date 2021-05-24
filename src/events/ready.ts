import { Client } from 'discord.js';
import i18n from 'i18n';

import { config } from '../index';
i18n.setLocale(config.LOCALE);
import keepAlive from '../server';

module.exports = async (client: Client) => {
  // Start Express Website
  keepAlive(client);
  console.log(`${i18n.__('ready.loggedin')} ${client.user!.username}`);
  client.user!.setPresence({
    status: 'online', // You can show online, idle, and dnd
    activity: {
      name: `${config.PRESENCE} | ${config.prefix}help`, // The Activity shown
      type: 'LISTENING' // PLAYING, WATCHING, LISTENING or STREAMING
    }
  });
};
