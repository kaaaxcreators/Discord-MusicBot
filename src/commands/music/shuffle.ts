import { Client, Message } from 'discord.js';

import { queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'shuffle',
    description: 'Shuffle queue',
    usage: '',
    aliases: []
  },

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError('There is no queue.', message.channel).catch(console.error);
    try {
      const songs = serverQueue.songs;
      for (let i = songs.length - 1; i > 1; i--) {
        const j = 1 + Math.floor(Math.random() * i);
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
      serverQueue.songs = songs;
      queue.set(message.guild!.id, serverQueue);
      message.react('✅');
    } catch (error) {
      message.guild!.me!.voice.channel!.leave();
      queue.delete(message.guild!.id);
      return sendError(
        `:notes: The player has stopped and the queue has been cleared.: \`${error}\``,
        message.channel
      );
    }
  }
};
