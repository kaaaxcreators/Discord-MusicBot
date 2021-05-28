import { Client, Message } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
  info: {
    name: 'shuffle',
    description: i18n.__('shuffle.description'),
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
    )
      return sendError(i18n.__('error.samevc'), message.channel);
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
      return sendError(`:notes: ${i18n.__('error.music')}: \`${error}\``, message.channel);
    }
  }
} as Command;
