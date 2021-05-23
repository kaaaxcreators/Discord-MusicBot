import { Client, Message } from 'discord.js';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'loop',
    description: 'Toggle music loop',
    usage: '',
    aliases: ['l'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue) {
      serverQueue.loop = !serverQueue.loop;
      return message.channel.send({
        embed: {
          color: 'GREEN',
          description: `🔂  **|**  Loop is **\`${
            serverQueue.loop === true ? 'enabled' : 'disabled'
          }\`**`
        }
      });
    }
    return sendError('There is nothing playing in this server.', message.channel);
  }
} as Command;
