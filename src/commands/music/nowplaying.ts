import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';
import { Song } from '../../util/playing';
import ProgressBar from '../../util/ProgressBar';

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

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) {
      return sendError(i18next.t('error.noqueue'), message.channel);
    }
    const song: Song = serverQueue.songs[0];
    let Progress: Progress;
    if (song.live) {
      Progress = {
        Bar: '▇—▇—▇—▇—▇—',
        percentageText: i18next.t('nowplaying.live')
      };
    } else {
      Progress = ProgressBar(serverQueue.connection?., song.duration, 10);
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
  }
} as Command;

export interface Progress {
  Bar: string;
  percentageText: string;
}
