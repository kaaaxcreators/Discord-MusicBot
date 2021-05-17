import { Client } from 'discord.js';

import { config } from '../index';
import keepAlive from '../server';

module.exports = async (client: Client) => {
  keepAlive(client);
  console.log(`[API] Logged in as ${client.user!.username}`);
  client.user!.setPresence({
    status: 'online', // You can show online, idle, and dnd
    activity: {
      name: `${config.PRESENCE} | ${config.prefix}help`, // The message shown
      type: 'LISTENING' // PLAYING, WATCHING, LISTENING or STREAMING
    }
  });
};
