import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command } from '../../index.js';
import { getPrefix } from '../../util/database.js';

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
  run: async function (client, message) {
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setDescription(i18next.t('count.embed.description', { servers: client.guilds.cache.size }))
      .setFooter(i18next.t('count.embed.footer', { prefix: await getPrefix(message) }));
    return message.channel.send({ embeds: [embed] });
  },
  interaction: {
    options: [],
    run: async function (client, interaction) {
      const embed = new MessageEmbed()
        .setColor('YELLOW')
        .setDescription(i18next.t('count.embed.description', { servers: client.guilds.cache.size }))
        .setFooter(i18next.t('count.embed.footer', { prefix: await getPrefix(interaction) }));
      return interaction.reply({ embeds: [embed] });
    }
  }
} as Command;
