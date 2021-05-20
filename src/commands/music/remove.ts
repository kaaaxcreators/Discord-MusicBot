import { Client, Message } from 'discord.js';

import { config, queue as Queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'remove',
    description: 'Remove song from the queue',
    usage: '<number>',
    aliases: ['rm']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const queue = Queue.get(message.guild!.id);
    if (!queue) return sendError('There is no queue.', message.channel).catch(console.error);
    if (!args.length)
      return sendError(`Usage: ${config.prefix}\`remove <Queue Number>\``, message.channel);
    if (isNaN(Number(args[0])))
      return sendError(`Usage: ${config.prefix}\`remove <Queue Number>\``, message.channel);
    if (queue.songs.length == 1)
      return sendError('There is no queue.', message.channel).catch(console.error);
    if (Number(args[0]) > queue.songs.length)
      return sendError(
        `The queue is only ${queue.songs.length} songs long!`,
        message.channel
      ).catch(console.error);
    try {
      const song = queue.songs.splice(Number(args[0]) - 1, 1);
      sendError(
        `❌ **|** Removed: **\`${song[0].title}\`** from the queue.`,
        queue.textChannel
      ).catch(console.error);
      message.react('✅');
    } catch (error) {
      return sendError(
        `:notes: An unexpected error occurred.\nPossible type: ${error}`,
        message.channel
      );
    }
  }
};
