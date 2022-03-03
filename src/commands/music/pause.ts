import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'pause',
    description: i18next.t('pause.description'),
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
    if (serverQueue && !serverQueue.paused) {
      try {
        serverQueue.pause();
      } catch (error) {
        queue.delete(message.guild!.id);
        return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, message.channel);
      }
      const embed = new MessageEmbed()
        .setDescription(i18next.t('pause.embed.description'))
        .setColor('YELLOW')
        .setTitle(i18next.t('pause.embed.title'));
      return message.channel.send({ embeds: [embed] });
    }
    return sendError(i18next.t('error.noqueue'), message.channel);
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
      if (serverQueue && !serverQueue.paused) {
        try {
          serverQueue.pause();
        } catch (error) {
          queue.delete(interaction.guild!.id);
          return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, interaction);
        }
        const embed = new MessageEmbed()
          .setDescription(i18next.t('pause.embed.description'))
          .setColor('YELLOW')
          .setTitle(i18next.t('pause.embed.title'));
        return interaction.reply({ embeds: [embed] });
      }
      return sendError(i18next.t('error.noqueue'), interaction);
    }
  }
} as Command;
