import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';

module.exports = {
  info: {
    name: 'volume',
    description: i18next.t('volume.description'),
    usage: '[volume]',
    aliases: ['v', 'vol'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message, args) {
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
    if (!args[0]) {
      return message.channel.send(i18next.t('volume.current', { volume: serverQueue.volume })!);
    }
    if (isNaN(Number(args[0]))) {
      return message.channel.send(':notes: ' + i18next.t('volume.numbers')).catch();
    }
    if (parseInt(args[0]) > 150 || Number(args[0]) < 0) {
      return sendError(i18next.t('volume.between'), message.channel).catch();
    }
    serverQueue.setVolume(parseInt(args[0]));
    const embed = new MessageEmbed()
      .setDescription(i18next.t('volume.embed.description', { volume: Number(args[0]) / 1 }))
      .setAuthor(
        'Server Volume Manager',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send({ embeds: [embed] });
  },
  interaction: {
    options: [
      {
        name: 'volume',
        description: 'Volume to change to',
        type: 'NUMBER',
        required: false
      }
    ],
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
      const volume = interaction.options.getNumber('volume', false);
      if (!volume) {
        return interaction.reply(i18next.t('volume.current', { volume: serverQueue.volume })!);
      }
      if (volume > 150 || volume < 0) {
        return sendError(i18next.t('volume.between'), interaction).catch();
      }
      serverQueue.setVolume(volume);
      const embed = new MessageEmbed()
        .setDescription(i18next.t('volume.embed.description', { volume: volume / 1 }))
        .setAuthor(
          'Server Volume Manager',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setColor('BLUE');
      return interaction.reply({ embeds: [embed] });
    }
  }
} as Command;
