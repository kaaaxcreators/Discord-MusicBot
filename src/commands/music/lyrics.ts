import { Client, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import lyricsFinder from 'lyrics-finder';

import { Command, queue as Queue } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';
import Util from '../../util/pagination';

module.exports = {
  info: {
    name: 'lyrics',
    description: i18next.t('lyrics.description'),
    usage: '',
    aliases: ['ly'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'MANAGE_MESSAGES', 'ADD_REACTIONS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }

    let lyrics: string[] = [];

    try {
      lyrics = await lyricsFinder(queue.songs[0].title);
      if (!lyrics) {
        lyrics = [`${i18next.t('lyrics.notfound')} ${queue.songs[0].title}.`];
      }
    } catch (error) {
      lyrics = [`${i18next.t('lyrics.notfound')} ${queue.songs[0].title}.`];
    }
    const splittedLyrics = Util.chunk(lyrics, 1024);

    const embed = new MessageEmbed()
      .setAuthor(
        i18next.t('lyrics.embed.author', { song: queue.songs[0].title }),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(queue.songs[0].img)
      .setColor('YELLOW')
      .setDescription(splittedLyrics[0])
      .setFooter(i18next.t('lyrics.embed.footer', { pages: splittedLyrics.length }))
      .setTimestamp();

    const lyricsMsg = await message.channel.send(embed);
    if (splittedLyrics.length > 1) {
      await Util.pagination(lyricsMsg, message.author, splittedLyrics);
    }
  }
} as Command;
