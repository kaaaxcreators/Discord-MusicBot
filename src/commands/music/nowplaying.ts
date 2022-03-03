import { MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index.js';
import sendError from '../../util/error.js';
import ProgressBar, { Progress } from '../../util/ProgressBar.js';

module.exports = {
  info: {
    name: 'nowplaying',
    description: i18next.t('nowplaying.description'),
    usage: '',
    aliases: ['np'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message) {
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue || !serverQueue.currentResource) {
      return sendError(i18next.t('error.noqueue'), message.channel);
    }
    const song = serverQueue.queue[0];
    let Progress: Progress;
    if (song.live) {
      Progress = {
        Bar: '▇—▇—▇—▇—▇—',
        percentageText: i18next.t('nowplaying.live')
      };
    } else {
      Progress = ProgressBar(serverQueue.currentResource.playbackDuration, song.duration, 10);
    }
    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('nowplaying.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField(i18next.t('nowplaying.embed.name'), song.title, true)
      .addField(i18next.t('nowplaying.embed.progress'), Progress.Bar, true)
      .addField(i18next.t('nowplaying.embed.percentage'), Progress.percentageText, true)
      .addField(i18next.t('nowplaying.embed.request'), song.req.tag, true)
      .setFooter(`${i18next.t('nowplaying.embed.views')} ${song.views} | ${song.ago}`);
    return message.channel.send({ embeds: [embed] });
  },
  interaction: {
    options: [],
    run: async function (client, interaction) {
      const serverQueue = queue.get(interaction.guild!.id);
      if (!serverQueue || !serverQueue.currentResource) {
        return sendError(i18next.t('error.noqueue'), interaction);
      }
      const song = serverQueue.queue[0];
      let Progress: Progress;
      if (song.live) {
        Progress = {
          Bar: '▇—▇—▇—▇—▇—',
          percentageText: i18next.t('nowplaying.live')
        };
      } else {
        Progress = ProgressBar(serverQueue.currentResource.playbackDuration, song.duration, 10);
      }
      const embed = new MessageEmbed()
        .setAuthor(
          i18next.t('nowplaying.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img)
        .setColor('BLUE')
        .addField(i18next.t('nowplaying.embed.name'), song.title, true)
        .addField(i18next.t('nowplaying.embed.progress'), Progress.Bar, true)
        .addField(i18next.t('nowplaying.embed.percentage'), Progress.percentageText, true)
        .addField(i18next.t('nowplaying.embed.request'), song.req.tag, true)
        .setFooter(`${i18next.t('nowplaying.embed.views')} ${song.views} | ${song.ago}`);
      return interaction.reply({ embeds: [embed] });
    }
  }
} as Command;
