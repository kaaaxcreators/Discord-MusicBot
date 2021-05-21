import { Client, Message, MessageEmbed } from 'discord.js';
import lyricsFinder from 'lyrics-finder';

import { Command, queue as Queue } from '../../index';
import sendError from '../../util/error';
import Util from '../../util/pagination';

module.exports = {
  info: {
    name: 'lyrics',
    description: 'Get lyrics for the currently playing song',
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
    if (!queue) return sendError('There is nothing playing.', message.channel).catch(console.error);

    let lyrics: string[] = [];

    try {
      lyrics = await lyricsFinder(queue.songs[0].title);
      if (!lyrics) lyrics = [`No lyrics found for ${queue.songs[0].title}.`];
    } catch (error) {
      lyrics = [`No lyrics found for ${queue.songs[0].title}.`];
    }
    const splittedLyrics = Util.chunk(lyrics, 1024);

    const lyricsEmbed = new MessageEmbed()
      .setAuthor(
        `${queue.songs[0].title} — Lyrics`,
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(queue.songs[0].img)
      .setColor('YELLOW')
      .setDescription(splittedLyrics[0])
      .setFooter(`Page 1 of ${splittedLyrics.length}.`)
      .setTimestamp();

    const lyricsMsg = await message.channel.send(lyricsEmbed);
    if (splittedLyrics.length > 1) await Util.pagination(lyricsMsg, message.author, splittedLyrics);
  }
} as Command;
