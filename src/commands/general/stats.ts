import { Client, Message, MessageEmbed } from 'discord.js';
import moment from 'moment';
import pMS from 'pretty-ms';

import { Command } from '../..';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stats',
    description: 'Get Bot Stats',
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
        .setTitle(`📊 Statistics about ${client.user?.username}`)
        .setThumbnail(client.user!.avatarURL()!)
        .setColor('RANDOM')
        .addField('Uptime', pMS(client.uptime!), true)
        .addField('Members', totalmembers, true)
        .addField('Servers', guilds.length, true)
        .addField('Running Since', uptime.toLocaleString(), true)
        .addField('Started', moment(uptime).fromNow(), true)
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send(embed);
    } catch {
      return sendError('Something went wrong', message.channel);
    }
  }
} as Command;
