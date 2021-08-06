import { Client, Message } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
  info: {
    name: 'shuffle',
    description: i18next.t('shuffle.description'),
    usage: '',
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    if (
      !message.member?.voice.channel ||
      message.member?.voice.channel != message.guild?.me?.voice.channel
    ) {
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) {
      return sendError('There is no queue.', message.channel).catch(console.error);
    }
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
      message.guild!.me!.voice.disconnect();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18next.t('error.music')}: \`${error}\``, message.channel);
    }
  }
} as Command;
