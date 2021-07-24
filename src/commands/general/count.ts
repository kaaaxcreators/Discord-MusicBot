import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command } from '../../index';
import { getPrefix } from '../../util/database';

module.exports = {
  info: {
    name: 'count',
    description: i18next.t('count.description'),
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
      .setDescription(i18next.t('count.embed.description', { servers: client.guilds.cache.size }))
      .setFooter(i18next.t('count.embed.footer', { prefix: await getPrefix(message) }));
    return message.channel.send(embed);
  }
} as Command;
