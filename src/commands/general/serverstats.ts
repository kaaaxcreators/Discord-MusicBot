import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import moment from 'moment';

import { Command } from '../../index.js';
import sendError from '../../util/error.js';

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
  run: async function (client, message) {
    try {
      if (message.channel.type == 'DM') {
        return sendError(i18next.t('error.nodm'), message.channel);
      }
      const guild = message.guild!;
      const textchannels = guild.channels.cache.filter((channel) => channel.type == 'GUILD_TEXT');
      const voicechannels = guild.channels.cache.filter((channel) => channel.type == 'GUILD_VOICE');
      const categories = guild.channels.cache.filter((channel) => channel.type == 'GUILD_CATEGORY');
      const otherchannels = guild.channels.cache.filter(
        (channel) => channel.type == 'GUILD_NEWS' || channel.type == 'GUILD_STORE'
      );
      const guildowner = guild.ownerId;
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
          `• ${i18next.t('serverstats.embed.member.owner')} <@${guildowner}>\n• ${i18next.t(
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
          `• ${i18next.t(
            'serverstats.embed.other.created'
          )} ${guild.createdAt.toLocaleDateString()}, ${moment(guild.createdAt).fromNow()}`
        )
        .setFooter(message.author.username, message.author.avatarURL()!)
        .setTimestamp();
      return message.channel.send({ embeds: [embed] });
    } catch {
      return sendError(i18next.t('error.something'), message.channel);
    }
  },
  interaction: {
    options: [],
    run: async function (client, interaction) {
      try {
        if (interaction.channel!.type === 'DM') {
          return sendError(i18next.t('error.nodm'), interaction);
        }
        const guild = interaction.guild!;
        const textchannels = guild.channels.cache.filter((channel) => channel.type == 'GUILD_TEXT');
        const voicechannels = guild.channels.cache.filter(
          (channel) => channel.type == 'GUILD_VOICE'
        );
        const categories = guild.channels.cache.filter(
          (channel) => channel.type == 'GUILD_CATEGORY'
        );
        const otherchannels = guild.channels.cache.filter(
          (channel) => channel.type == 'GUILD_NEWS' || channel.type == 'GUILD_STORE'
        );
        const guildowner = guild.ownerId;
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
            `• ${i18next.t('serverstats.embed.member.owner')} <@${guildowner}>\n• ${i18next.t(
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
            `• ${i18next.t(
              'serverstats.embed.other.created'
            )} ${guild.createdAt.toLocaleDateString()}, ${moment(guild.createdAt).fromNow()}`
          )
          .setFooter(interaction.user.username, interaction.user.avatarURL()!)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      } catch {
        return sendError(i18next.t('error.something'), interaction);
      }
    }
  }
} as Command;
