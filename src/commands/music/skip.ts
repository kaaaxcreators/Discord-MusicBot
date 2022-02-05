import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';

export default {
  info: {
    name: 'skip',
    description: i18next.t('skip.description'),
    usage: '',
    aliases: ['s'],
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
      return sendError(i18next.t('skip.nothing'), message.channel);
    }
    if (!serverQueue.voiceConnection) {
      return;
    }
    if (!serverQueue.audioPlayer) {
      return;
    }
    if (serverQueue && serverQueue.paused) {
      serverQueue.resume();
      const embed = new MessageEmbed()
        .setDescription(i18next.t('resume.embed.description'))
        .setColor('YELLOW')
        .setTitle(i18next.t('resume.embed.author'));

      return message.channel.send({ embeds: [embed] }).catch();
    }

    try {
      serverQueue.skip();
    } catch (error) {
      serverQueue.voiceChannel.guild.me?.voice.disconnect();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, message.channel);
    }
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
        return sendError(i18next.t('skip.nothing'), interaction);
      }
      if (!serverQueue.voiceConnection) {
        return;
      }
      if (!serverQueue.audioPlayer) {
        return;
      }
      if (serverQueue && serverQueue.paused) {
        serverQueue.resume();
        const embed = new MessageEmbed()
          .setDescription(i18next.t('resume.embed.description'))
          .setColor('YELLOW')
          .setTitle(i18next.t('resume.embed.author'));

        return interaction.reply({ embeds: [embed] }).catch();
      }

      try {
        serverQueue.skip();
      } catch (error) {
        serverQueue.voiceChannel.guild.me?.voice.disconnect();
        queue.delete(interaction.guild!.id);
        return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, interaction);
      }
      interaction.reply('✅');
    }
  }
} as Command;
