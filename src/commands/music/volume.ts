import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

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

  run: async function (client: Client, message: Message, args: string[]) {
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
    if (!serverQueue.connection) {
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
    serverQueue.volume = Number(args[0]);
    serverQueue.resource?.volume?.setVolumeLogarithmic(Number(args[0]) / 100);
    const embed = new MessageEmbed()
      .setDescription(i18next.t('volume.embed.description', { volume: Number(args[0]) / 1 }))
      .setAuthor(
        'Server Volume Manager',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send({ embeds: [embed] });
  }
} as Command;
