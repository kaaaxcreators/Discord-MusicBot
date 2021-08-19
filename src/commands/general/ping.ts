import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command } from '../../index';
import { getPrefix } from '../../util/database';

module.exports = {
  info: {
    name: 'ping',
    description: i18next.t('ping.description'),
    usage: '',
    aliases: ['latency'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    return message.channel.send(i18next.t('ping.loading')!).then(async (msg) => {
      msg.deletable ? msg.delete() : null;
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(i18next.t('ping.embed.description'))
        .addField(
          i18next.t('ping.embed.latency'),
          msg.createdTimestamp - message.createdTimestamp + 'ms',
          true
        )
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(i18next.t('ping.embed.footer', { prefix: await getPrefix(message) }));
      message.channel.send({ embeds: [embed] });
    });
  }
} as Command;
