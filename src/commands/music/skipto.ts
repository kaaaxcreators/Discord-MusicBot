import { Client, Message } from 'discord.js';

import { config, queue as Queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'skipto',
    description: 'Skip to the selected queue number',
    usage: '<number>',
    aliases: ['st']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    if (!args.length || isNaN(Number(args[0])))
      return message.channel
        .send({
          embed: {
            color: 'GREEN',
            description: `**Usage**: \`${config.prefix}skipto <number>\``
          }
        })
        .catch(console.error);

    const queue = Queue.get(message.guild!.id);
    if (!queue) return sendError('There is no queue.', message.channel).catch(console.error);
    if (Number(args[0]) > queue.songs.length)
      return sendError(
        `The queue is only ${queue.songs.length} songs long!`,
        message.channel
      ).catch(console.error);

    queue.playing = true;

    if (queue.loop) {
      for (let i = 0; i < Number(args[0]) - 2; i++) {
        queue.songs.push(queue.songs.shift()!);
      }
    } else {
      queue.songs = queue.songs.slice(Number(args[0]) - 2);
    }
    try {
      queue.connection!.dispatcher.end();
    } catch (error) {
      queue.voiceChannel.leave();
      Queue.delete(message.guild!.id);
      return sendError(
        `:notes: The player has stopped and the queue has been cleared.: ${error}`,
        message.channel
      );
    }

    queue.textChannel
      .send({
        embed: {
          color: 'GREEN',
          description: `${message.author} ⏭ skipped \`${Number(args[0]) - 1}\` songs`
        }
      })
      .catch(console.error);
    message.react('✅');
  }
};
