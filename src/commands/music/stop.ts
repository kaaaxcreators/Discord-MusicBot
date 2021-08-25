import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stop',
    description: i18next.t('stop.description'),
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
      return sendError(i18next.t('stop.nothing'), message.channel);
    }
    if (!serverQueue.voiceConnection) {
      return;
    }
    if (!serverQueue.audioPlayer) {
      return;
    }
    try {
      serverQueue.stop();
    } catch (error) {
      message.guild!.me!.voice.disconnect();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, message.channel);
    }
    queue.delete(message.guild!.id);
    serverQueue.queue = [];
    message.react('✅');
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
        return sendError(i18next.t('stop.nothing'), interaction);
      }
      if (!serverQueue.voiceConnection) {
        return;
      }
      if (!serverQueue.audioPlayer) {
        return;
      }
      try {
        serverQueue.stop();
      } catch (error) {
        interaction.guild!.me!.voice.disconnect();
        queue.delete(interaction.guild!.id);
        return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, interaction);
      }
      queue.delete(interaction.guild!.id);
      serverQueue.queue = [];
      interaction.reply('✅');
    }
  }
} as Command;
