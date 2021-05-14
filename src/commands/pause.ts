import { Client, Message, MessageEmbed } from 'discord.js';

import { queue } from '../index';
import sendError from '../util/error';

module.exports = {
  info: {
    name: 'pause',
    description: 'To pause the current music in the server',
    usage: '',
    aliases: []
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
      const xd = new MessageEmbed()
        .setDescription('⏸ Paused the music for you!')
        .setColor('YELLOW')
        .setTitle('Music has been paused!');
      return message.channel.send(xd);
    }
    return sendError('There is nothing playing in this server.', message.channel);
  }
};
