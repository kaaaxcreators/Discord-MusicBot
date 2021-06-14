import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config } from '../../index';
i18n.setLocale(config.LOCALE);
import database, { getGuild } from '../../util/database';
import sendError from '../../util/error';
i18n.setLocale(config.LOCALE);

module.exports = {
  info: {
    name: 'prefix',
    description: i18n.__('prefix.description'),
    usage: '<prefix>',
    aliases: [],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: ['ADMINISTRATOR']
    }
  },
  run: async function (client: Client, message: Message, args: string[]) {
    if (message.channel.type == 'dm') {
      return sendError(i18n.__('error.nodm'), message.channel);
    }
    if (!config.GUILDPREFIX) {
      return sendError(i18n.__('prefix.notenabled'), message.channel);
    }
    const guildDB = await getGuild(message.guild!.id);
    if (!guildDB) {
      return sendError('error.something', message.channel);
    }
    const oldprefix = guildDB.prefix;
    const newprefix = args.join(' ');
    if (!newprefix) {
      return message.channel.send(
        new MessageEmbed()
          .setTitle(i18n.__('prefix.embed.title'))
          .setDescription(i18n.__mf('prefix.noargsembed.description', { oldprefix: oldprefix }))
          .setFooter(i18n.__mf('prefix.noargsembed.footer', { oldprefix: oldprefix }))
      );
    }
    database.set(message.guild!.id, { prefix: newprefix });
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setTitle(i18n.__('prefix.embed.title'))
      .setDescription(
        i18n.__mf('prefix.embed.description', { oldprefix: oldprefix, newprefix: newprefix })
      )
      .setFooter(i18n.__mf('prefix.embed.footer', { prefix: config.prefix }));
    return message.channel.send(embed);
  }
} as Command;
