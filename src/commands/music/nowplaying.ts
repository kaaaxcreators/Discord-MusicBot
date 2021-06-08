import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import { Song } from '../../util/playing';
import ProgressBar from '../../util/ProgressBar';

module.exports = {
  info: {
    name: 'nowplaying',
    description: i18n.__('nowplaying.description'),
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
      return sendError(i18n.__('error.noqueue'), message.channel);
    }
    const song: Song = serverQueue.songs[0];
    let Progress: Progress;
    if (song.live) {
      Progress = {
        Bar: '▇—▇—▇—▇—▇—',
        percentageText: i18n.__('nowplaying.live')
      };
    } else {
      Progress = ProgressBar(serverQueue.connection!.dispatcher.streamTime, song.duration, 10);
    }
    const embed = new MessageEmbed()
      .setAuthor(
        i18n.__('nowplaying.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField(i18n.__('nowplaying.embed.name'), song.title, true)
      .addField(i18n.__('nowplaying.embed.progress'), Progress.Bar, true)
      .addField(i18n.__('nowplaying.embed.percentage'), Progress.percentageText, true)
      .addField(i18n.__('nowplaying.embed.request'), song.req.tag, true)
      .setFooter(`${i18n.__('nowplaying.embed.views')} ${song.views} | ${song.ago}`);
    return message.channel.send(embed);
  }
} as Command;

export interface Progress {
  Bar: string;
  percentageText: string;
}
