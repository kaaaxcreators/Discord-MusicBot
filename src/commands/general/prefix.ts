import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, config } from '../../index.js';
import database, { getGuild } from '../../util/database.js';
import sendError from '../../util/error.js';

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
  run: async function (client, message, args) {
    if (message.channel.type == 'DM') {
      return sendError(i18next.t('error.nodm'), message.channel);
    }
    if (!config.GUILDPREFIX) {
      return sendError(i18next.t('prefix.notenabled'), message.channel);
    }
    const guildDB = await getGuild(message.guild!.id);
    if (!guildDB) {
      return sendError(i18next.t('error.something'), message.channel);
    }
    const oldprefix = guildDB.prefix;
    const newprefix = args.join(' ');
    if (!newprefix) {
      return message.channel.send({
        embeds: [
          new MessageEmbed()
            .setTitle(i18next.t('prefix.embed.title'))
            .setDescription(i18next.t('prefix.noargsembed.description', { oldprefix: oldprefix }))
            .setFooter(i18next.t('prefix.noargsembed.footer', { oldprefix: oldprefix }))
        ]
      });
    }
    database.set(message.guild!.id, { prefix: newprefix });
    const embed = new MessageEmbed()
      .setColor('YELLOW')
      .setTitle(i18next.t('prefix.embed.title'))
      .setDescription(
        i18next.t('prefix.embed.description', { oldprefix: oldprefix, newprefix: newprefix })
      )
      .setFooter(i18next.t('prefix.embed.footer', { prefix: newprefix }));
    return message.channel.send({ embeds: [embed] });
  },
  interaction: {
    options: [
      {
        name: 'prefix',
        description: 'New Prefix',
        type: 'STRING',
        required: false
      }
    ],
    run: async function (client, interaction) {
      if (!config.GUILDPREFIX) {
        return sendError(i18next.t('prefix.notenabled'), interaction);
      }
      const newprefix = interaction.options.getString('prefix', false);
      const guildDB = await getGuild(interaction.guildId!);
      if (!guildDB) {
        return sendError(i18next.t('error.something'), interaction);
      }
      const oldprefix = guildDB.prefix;
      if (!newprefix) {
        interaction.reply({
          embeds: [
            new MessageEmbed()
              .setTitle(i18next.t('prefix.embed.title'))
              .setDescription(i18next.t('prefix.noargsembed.description', { oldprefix: oldprefix }))
              .setFooter(i18next.t('prefix.noargsembed.footer', { oldprefix: oldprefix }))
          ]
        });
      } else {
        database.set(interaction.guildId!, { prefix: newprefix });
        const embed = new MessageEmbed()
          .setColor('YELLOW')
          .setTitle(i18next.t('prefix.embed.title'))
          .setDescription(
            i18next.t('prefix.embed.description', { oldprefix: oldprefix, newprefix: newprefix })
          )
          .setFooter(i18next.t('prefix.embed.footer', { prefix: newprefix }));
        interaction.reply({ embeds: [embed] });
      }
    }
  }
} as Command;
