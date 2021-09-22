import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'earrape',
    description: i18next.t('earrape.description'),
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
      return sendError(i18next.t('error.noqueue'), message.channel);
    }
    if (!serverQueue.voiceConnection) {
      return sendError(i18next.t('error.noqueue'), message.channel);
    }
    // Detect if earrape Mode is toggled with fixed volume (probably bad, but otherwise I would need persistence (e.g. db))
    const volume = serverQueue.volume == 696 ? 80 : 696;
    serverQueue.volume = volume;
    serverQueue.setVolume(volume);
    const embed = new MessageEmbed()
      .setDescription(i18next.t('earrape.embed.description', { volume: volume / 1 }))
      .setAuthor(
        i18next.t('earrape.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send({ embeds: [embed] });
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
        return sendError(i18next.t('error.noqueue'), interaction);
      }
      if (!serverQueue.voiceConnection) {
        return sendError(i18next.t('error.noqueue'), interaction);
      }
      // Detect if earrape Mode is toggled with fixed volume (probably bad, but otherwise I would need persistence (e.g. db))
      const volume = serverQueue.volume == 696 ? 80 : 696;
      serverQueue.volume = volume;
      serverQueue.setVolume(volume);
      const embed = new MessageEmbed()
        .setDescription(i18next.t('earrape.embed.description', { volume: volume / 1 }))
        .setAuthor(
          i18next.t('earrape.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setColor('BLUE');
      return interaction.reply({ embeds: [embed] });
    }
  }
} as Command;
