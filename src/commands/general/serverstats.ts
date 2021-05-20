import { Client, Message, MessageEmbed } from 'discord.js';
import moment from 'moment';

import { Command } from '../..';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'serverstats',
    description: 'Get Server Stats',
    usage: '',
    aliases: ['guildstats'],
    categorie: 'general',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },
  run: async function (client: Client, message: Message) {
    try {
      const guild = message.guild!;
      const textchannels = guild.channels.cache.filter((channel) => channel.type == 'text');
      const voicechannels = guild.channels.cache.filter((channel) => channel.type == 'voice');
      const categories = guild.channels.cache.filter((channel) => channel.type == 'category');
      const otherchannels = guild.channels.cache.filter(
        (channel) => channel.type == 'news' || channel.type == 'store'
      );
      const guildowner = guild.owner!;
      const roles = guild.roles.cache.map((role) => role).join(' ');
      const emojis = guild.emojis.cache.map((emoji) => emoji).join(' ');
      const embed = new MessageEmbed()
        .setTitle(`📈 Guild Information for ${guild.name}`)
        .setDescription(`ID: ${guild.id}`)
        .setThumbnail(guild.iconURL()!)
        .setColor('RANDOM')
        .addField(
          '❯ Channels',
          `• ${textchannels.size} Text\n• ${voicechannels.size} Voice\n• ${categories.size} Categories\n• ${otherchannels.size} Other`
        )
        .addField('❯ Member', `• Guild Owner: ${guildowner}\n• Total: ${guild.members.cache.size}`)
        .addField('❯ Roles', roles ? roles : 'None')
        .addField('❯ Emojis', emojis ? emojis : 'None')
        .addField(
          '❯ Other',
          `• Region: ${
            guild.region
          }\n• Created At: ${guild.createdAt.toLocaleDateString()}, ${moment(
            guild.createdAt
          ).fromNow()}`
        )
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send(embed);
    } catch {
      return sendError('An error occurred', message.channel);
    }
  }
} as Command;
