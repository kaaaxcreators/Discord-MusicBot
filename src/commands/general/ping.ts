import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config } from '../../index';
import { getPrefix } from '../../util/database';
i18n.setLocale(config.LOCALE);

module.exports = {
  info: {
    name: 'ping',
    description: i18n.__('ping.description'),
    usage: '',
    aliases: ['latency'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    return message.channel.send(i18n.__('ping.loading')).then(async (msg) => {
      msg.deletable ? msg.delete() : null;
      const embed = new MessageEmbed()
        .setColor('RANDOM')
        .setDescription(i18n.__('ping.embed.description'))
        .addField(
          i18n.__('ping.embed.latency'),
          msg.createdTimestamp - message.createdTimestamp + 'ms',
          true
        )
        .addField('WebSocket', Math.round(client.ws.ping) + 'ms', true)
        .setFooter(i18n.__mf('ping.embed.footer', { prefix: getPrefix(message) }));
      message.channel.send(embed);
    });
  }
} as Command;
