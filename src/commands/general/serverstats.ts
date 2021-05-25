import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';
import moment from 'moment';

import { Command, config } from '../../index';
i18n.setLocale(config.LOCALE);
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
      if (message.channel.type == 'dm')
        return sendError("This Command doesn't work in DMs", message.channel);
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
        .setTitle(`📈 ${i18n.__('serverstats.embed.title')} ${guild.name}`)
        .setDescription(`ID: ${guild.id}`)
        .setThumbnail(guild.iconURL()!)
        .setColor('RANDOM')
        .addField(
          '❯ ' + i18n.__('serverstats.embed.channels.channels'),
          `• ${textchannels.size} ${i18n.__('serverstats.embed.channels.text')}\n• ${
            voicechannels.size
          } ${i18n.__('serverstats.embed.channels.voice')}\n• ${categories.size} ${i18n.__(
            'serverstats.embed.channels.categories'
          )}\n• ${otherchannels.size} ${i18n.__('serverstats.embed.channels.other')}`
        )
        .addField(
          '❯ ' + i18n.__('serverstats.member.member'),
          `• ${i18n.__('serverstats.member.owner')} ${guildowner}\n• ${i18n.__(
            'serverstats.member.total'
          )} ${guild.members.cache.size}`
        )
        .addField(
          '❯ ' + i18n.__('serverstats.embed.roles'),
          roles ? roles : i18n.__('serverstats.embed.none')
        )
        .addField(
          '❯ ' + i18n.__('serverstats.embed.emojis'),
          emojis ? emojis : i18n.__('serverstats.embed.none')
        )
        .addField(
          '❯ ' + i18n.__('serverstats.embed.other.other'),
          `• ${i18n.__('serverstats.embed.other.region')} ${guild.region}\n• ${i18n.__(
            'serverstats.embed.other.created'
          )} ${guild.createdAt.toLocaleDateString()}, ${moment(guild.createdAt).fromNow()}`
        )
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send(embed);
    } catch {
      return sendError(i18n.__('error.something'), message.channel);
    }
  }
} as Command;
