import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'leave',
    aliases: ['goaway', 'disconnect'],
    description: i18next.t('leave.description'),
    usage: '',
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel;
    if (!channel) {
      return sendError(i18next.t('error.needvc'), message.channel);
    }
    if (!message.guild!.me!.voice.channel) {
      return sendError(i18next.t('leave.notinvc'), message.channel);
    }

    try {
      queue.delete(message.guild!.id);
      await message.guild!.me!.voice.disconnect();
    } catch (error) {
      return sendError(i18next.t('leave.trying'), message.channel);
    }

    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('leave.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('GREEN')
      .setTitle(i18next.t('leave.embed.title'))
      .setDescription(i18next.t('leave.embed.description'))
      .setTimestamp();

    return message.channel
      .send({ embeds: [embed] })
      .catch(() => message.channel.send(i18next.t('leave.left')!));
  }
} as Command;
