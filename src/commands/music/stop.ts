import { Client, Message } from 'discord.js';

import { queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stop',
    description: 'To stop the music and clearing the queue',
    usage: '',
    aliases: [],
    categorie: 'music'
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel!;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue)
      return sendError('There is nothing playing that I could stop for you.', message.channel);
    if (!serverQueue.connection) return;
    if (!serverQueue.connection.dispatcher) return;
    try {
      serverQueue.connection.dispatcher.end();
    } catch (error) {
      message.guild!.me!.voice.channel!.leave();
      queue.delete(message.guild!.id);
      return sendError(
        `:notes: The player has stopped and the queue has been cleared.: ${error}`,
        message.channel
      );
    }
    queue.delete(message.guild!.id);
    serverQueue.songs = [];
    message.react('✅');
  }
};
