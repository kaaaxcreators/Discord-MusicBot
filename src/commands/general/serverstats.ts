import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import moment from 'moment';

import { Command } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'serverstats',
    description: i18next.t('serverstats.description'),
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
      if (message.channel.type == 'dm') {
        return sendError(i18next.t('error.nodm'), message.channel);
      }
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
        .setTitle(`📈 ${i18next.t('serverstats.embed.title')} ${guild.name}`)
        .setDescription(`ID: ${guild.id}`)
        .setThumbnail(guild.iconURL()!)
        .setColor('RANDOM')
        .addField(
          '❯ ' + i18next.t('serverstats.embed.channels.channels'),
          `• ${textchannels.size} ${i18next.t('serverstats.embed.channels.text')}\n• ${
            voicechannels.size
          } ${i18next.t('serverstats.embed.channels.voice')}\n• ${categories.size} ${i18next.t(
            'serverstats.embed.channels.categories'
          )}\n• ${otherchannels.size} ${i18next.t('serverstats.embed.channels.other')}`
        )
        .addField(
          '❯ ' + i18next.t('serverstats.embed.member.member'),
          `• ${i18next.t('serverstats.embed.member.owner')} ${guildowner}\n• ${i18next.t(
            'serverstats.embed.member.total'
          )} ${guild.members.cache.size}`
        )
        .addField(
          '❯ ' + i18next.t('serverstats.embed.roles'),
          roles ? roles : i18next.t('serverstats.embed.none')
        )
        .addField(
          '❯ ' + i18next.t('serverstats.embed.emojis'),
          emojis ? emojis : i18next.t('serverstats.embed.none')
        )
        .addField(
          '❯ ' + i18next.t('serverstats.embed.other.other'),
          `• ${i18next.t('serverstats.embed.other.region')} ${guild.region}\n• ${i18next.t(
            'serverstats.embed.other.created'
          )} ${guild.createdAt.toLocaleDateString()}, ${moment(guild.createdAt).fromNow()}`
        )
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send(embed);
    } catch {
      return sendError(i18next.t('error.something'), message.channel);
    }
  }
} as Command;
