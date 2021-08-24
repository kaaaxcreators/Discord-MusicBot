import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import moment from 'moment';
import pMS from 'pretty-ms';

import { Command } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stats',
    description: i18next.t('stats.description'),
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
      // Get Voice Channel Count Bot is currently connected to
      let totalvcs = 0;
      for (const guild of client.guilds.cache.map((guilds) => guilds)) {
        if (guild.me?.voice.channel) {
          totalvcs += 1;
        }
      }
      const uptime = new Date(Date.now() - client.uptime!);
      const embed = new MessageEmbed()
        .setTitle(`📊 ${i18next.t('stats.embed.title')} ${client.user?.username}`)
        .setThumbnail(client.user!.avatarURL()!)
        .setColor('RANDOM')
        .addField(i18next.t('stats.embed.uptime'), pMS(client.uptime!), true)
        .addField(i18next.t('stats.embed.members'), totalmembers.toString(), true)
        .addField(i18next.t('stats.embed.servers'), guilds.length.toString(), true)
        .addField(i18next.t('stats.embed.running'), uptime.toLocaleString(), true)
        .addField(i18next.t('stats.embed.started'), moment(uptime).fromNow(), true)
        .addField(i18next.t('stats.embed.totalvcs'), totalvcs.toString(), true)
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
        const guilds = client.guilds.cache.map((guilds) => guilds);
        let totalmembers = 0;
        // Get Member Count (Bots included)
        for (const guild of client.guilds.cache.map((guilds) => guilds)) {
          totalmembers += guild.memberCount;
        }
        // Get Voice Channel Count Bot is currently connected to
        let totalvcs = 0;
        for (const guild of client.guilds.cache.map((guilds) => guilds)) {
          if (guild.me?.voice.channel) {
            totalvcs += 1;
          }
        }
        const uptime = new Date(Date.now() - client.uptime!);
        const embed = new MessageEmbed()
          .setTitle(`📊 ${i18next.t('stats.embed.title')} ${client.user?.username}`)
          .setThumbnail(client.user!.avatarURL()!)
          .setColor('RANDOM')
          .addField(i18next.t('stats.embed.uptime'), pMS(client.uptime!), true)
          .addField(i18next.t('stats.embed.members'), totalmembers.toString(), true)
          .addField(i18next.t('stats.embed.servers'), guilds.length.toString(), true)
          .addField(i18next.t('stats.embed.running'), uptime.toLocaleString(), true)
          .addField(i18next.t('stats.embed.started'), moment(uptime).fromNow(), true)
          .addField(i18next.t('stats.embed.totalvcs'), totalvcs.toString(), true)
          .setFooter(interaction.user.username, interaction.user.avatarURL()!)
          .setTimestamp();
        return interaction.reply({ embeds: [embed] });
      } catch {
        return sendError(i18next.t('error.something'), interaction);
      }
    }
  }
} as Command;
