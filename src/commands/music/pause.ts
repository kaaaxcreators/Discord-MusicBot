import { Client, Message, MessageEmbed } from 'discord.js';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'pause',
    description: 'Pause the current music',
    usage: '',
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      try {
        serverQueue.connection!.dispatcher.pause();
      } catch (error) {
        queue.delete(message.guild!.id);
        return sendError(
          `:notes: The player has stopped and the queue has been cleared.: ${error}`,
          message.channel
        );
      }
      const embed = new MessageEmbed()
        .setDescription('⏸ Paused the music for you!')
        .setColor('YELLOW')
        .setTitle('Music has been paused!');
      return message.channel.send(embed);
    }
    return sendError('There is nothing playing in this server.', message.channel);
  }
} as Command;
