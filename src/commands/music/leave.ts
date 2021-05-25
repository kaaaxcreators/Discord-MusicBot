import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'leave',
    aliases: ['goaway', 'disconnect'],
    description: i18n.__('leave.description'),
    usage: '',
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel;
    if (!channel) return sendError(i18n.__('error.needvc'), message.channel);
    if (!message.guild!.me!.voice.channel)
      return sendError(i18n.__('leave.notinvc'), message.channel);

    try {
      await message.guild!.me!.voice.channel.leave();
    } catch (error) {
      await message.guild!.me!.voice.kick(message.guild!.me!.id);
      return sendError(i18n.__('leave.trying'), message.channel);
    }

    const embed = new MessageEmbed()
      .setAuthor(
        i18n.__('leave.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('GREEN')
      .setTitle(i18n.__('leave.embed.title'))
      .setDescription(i18n.__('leave.embed.description'))
      .setTimestamp();

    return message.channel.send(embed).catch(() => message.channel.send(i18n.__('leave.left')));
  }
} as Command;
