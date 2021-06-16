import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config } from '../../index';
import { getPrefix } from '../../util/database';
i18n.setLocale(config.LOCALE);

module.exports = {
  info: {
    name: 'count',
    description: i18n.__('count.description'),
    usage: '',
    aliases: ['servercount'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setDescription(i18n.__mf('count.embed.description', { servers: client.guilds.cache.size }))
      .setFooter(i18n.__mf('count.embed.footer', { prefix: getPrefix(message) }));
    return message.channel.send(embed);
  }
} as Command;
