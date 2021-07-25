import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, config } from '../../index';
import database, { getGuild } from '../../util/database';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'prefix',
    description: i18next.t('prefix.description'),
    usage: '<prefix>',
    aliases: [],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: ['MANAGE_GUILD']
    }
  },
  run: async function (client: Client, message: Message, args: string[]) {
    if (message.channel.type == 'dm') {
      return sendError(i18next.t('error.nodm'), message.channel);
    }
    if (!config.GUILDPREFIX) {
      return sendError(i18next.t('prefix.notenabled'), message.channel);
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
          .setTitle(i18next.t('prefix.embed.title'))
          .setDescription(i18next.t('prefix.noargsembed.description', { oldprefix: oldprefix }))
          .setFooter(i18next.t('prefix.noargsembed.footer', { oldprefix: oldprefix }))
      );
    }
    database.set(message.guild!.id, { prefix: newprefix });
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setTitle(i18next.t('prefix.embed.title'))
      .setDescription(
        i18next.t('prefix.embed.description', { oldprefix: oldprefix, newprefix: newprefix })
      )
      .setFooter(i18next.t('prefix.embed.footer', { prefix: newprefix }));
    return message.channel.send(embed);
  }
} as Command;
