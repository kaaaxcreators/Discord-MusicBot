import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';
import console from '../../util/logger.js';

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

  run: async function (client, message) {
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
      const songs = serverQueue.queue;
      for (let i = songs.length - 1; i > 1; i--) {
        const j = 1 + Math.floor(Math.random() * i);
        [songs[i], songs[j]] = [songs[j], songs[i]];
      }
      serverQueue.queue = songs;
      queue.set(message.guild!.id, serverQueue);
      message.react('✅');
    } catch (error) {
      message.guild!.me!.voice.disconnect();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18next.t('error.music')}: \`${error}\``, message.channel);
    }
  },
  interaction: {
    options: [],
    run: async function (client, interaction, { isGuildMember }) {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      if (
        !interaction.member?.voice.channel ||
        interaction.member?.voice.channel != interaction.guild?.me?.voice.channel
      ) {
        return sendError(i18next.t('error.samevc'), interaction);
      }
      const serverQueue = queue.get(interaction.guild!.id);
      if (!serverQueue) {
        return sendError('There is no queue.', interaction).catch(console.error);
      }
      try {
        const songs = serverQueue.queue;
        for (let i = songs.length - 1; i > 1; i--) {
          const j = 1 + Math.floor(Math.random() * i);
          [songs[i], songs[j]] = [songs[j], songs[i]];
        }
        serverQueue.queue = songs;
        queue.set(interaction.guild!.id, serverQueue);
        interaction.reply('✅');
      } catch (error) {
        interaction.guild!.me!.voice.disconnect();
        queue.delete(interaction.guild!.id);
        return sendError(`:notes: ${i18next.t('error.music')}: \`${error}\``, interaction);
      }
    }
  }
} as Command;
