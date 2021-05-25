import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';
import moment from 'moment';
import pMS from 'pretty-ms';

import { Command, config } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stats',
    description: i18n.__('stats.description'),
    usage: '',
    aliases: ['uptime', 'statistics'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    try {
      const guilds = client.guilds.cache.map((guilds) => guilds);
      let totalmembers = 0;
      // Get Member Count (Bots included)
      for (const guild of client.guilds.cache.map((guilds) => guilds)) {
        totalmembers += guild.memberCount;
      }
      const uptime = new Date(Date.now() - client.uptime!);
      const embed = new MessageEmbed()
        .setTitle(`📊 ${i18n.__('stats.embed.title')} ${client.user?.username}`)
        .setThumbnail(client.user!.avatarURL()!)
        .setColor('RANDOM')
        .addField(i18n.__('stats.embed.uptime'), pMS(client.uptime!), true)
        .addField(i18n.__('stats.embed.members'), totalmembers, true)
        .addField(i18n.__('stats.embed.servers'), guilds.length, true)
        .addField(i18n.__('stats.embed.running'), uptime.toLocaleString(), true)
        .addField(i18n.__('stats.embed.started'), moment(uptime).fromNow(), true)
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send(embed);
    } catch {
      return sendError(i18n.__('error.something'), message.channel);
    }
  }
} as Command;
