import { Client, Message, MessageEmbed, Util } from 'discord.js';
import i18n from 'i18n';
import pMS from 'pretty-ms';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { Command, config, IQueue, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import play, { Song } from '../../util/playing';

module.exports = {
  info: {
    name: 'play',
    description: i18n.__('play.description'),
    usage: i18n.__('play.usage'),
    aliases: ['p'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel;
    if (!channel) return sendError(i18n.__('error.needvc'), message.channel);

    const searchString = args.join(' ');
    if (!searchString) return sendError(i18n.__('play.missingargs'), message.channel);
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(message.guild!.id);

    let songInfo;
    let song: Song;
    if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
      try {
        songInfo = await ytdl.getInfo(url);
        if (!songInfo) return sendError(i18n.__('play.notfound.youtube'), message.channel);
        song = {
          id: songInfo.videoDetails.videoId,
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
          duration: Number(songInfo.videoDetails.lengthSeconds) * 1000,
          ago: songInfo.videoDetails.publishDate,
          views: String(songInfo.videoDetails.viewCount).padStart(10, ' ').trim(),
          live: songInfo.videoDetails.isLiveContent,
          req: message.author
        };
      } catch (error) {
        return sendError(
          i18n.__('error.occurred') + ' ' + error.message || error,
          message.channel
        ).catch(console.error);
      }
    } else if (scdl.isValidUrl(url)) {
      try {
        songInfo = await scdl.getInfo(url);
        if (!songInfo) return sendError(i18n.__('play.notfound.soundcloud'), message.channel);
        song = {
          id: songInfo.permalink!,
          title: songInfo.title!,
          url: songInfo.permalink_url!,
          img: songInfo.artwork_url!,
          ago: songInfo.last_modified!,
          views: String(songInfo.playback_count).padStart(10, ' ').trim(),
          duration: Math.ceil(songInfo.duration!),
          req: message.author
        };
      } catch (error) {
        return sendError(
          i18n.__('error.occurred') + ' ' + error.message || error,
          message.channel
        ).catch(console.error);
      }
    } else if (spdl.validateURL(url)) {
      try {
        songInfo = await spdl.getInfo(url);
        if (!songInfo) return sendError(i18n.__('play.notfound.spotify'), message.channel);
        song = {
          id: songInfo.id,
          title: songInfo.title,
          url: songInfo.url,
          img: songInfo.thumbnail,
          ago: '-',
          views: '-',
          duration: songInfo.duration!,
          req: message.author
        };
      } catch (error) {
        return sendError(i18n.__('error.occurred'), message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);
        if (searched.videos.length === 0)
          return sendError(i18n.__('play.notfound.youtube'), message.channel);

        songInfo = searched.videos[0];
        song = {
          id: songInfo.videoId,
          title: Util.escapeMarkdown(songInfo.title),
          views: String(songInfo.views).padStart(10, ' ').trim(),
          url: songInfo.url,
          ago: songInfo.ago,
          duration: songInfo.duration.seconds * 1000,
          img: songInfo.image,
          req: message.author
        };
      } catch (error) {
        return sendError(
          i18n.__('error.occurred') + ' ' + error.message || error,
          message.channel
        ).catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      const embed = new MessageEmbed()
        .setAuthor(
          i18n.__('play.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img!)
        .setColor('YELLOW')
        .addField(i18n.__('play.embed.name'), song.title, true)
        .addField(i18n.__('play.embed.duration'), song.live ? 'LIVE' : pMS(song.duration), true)
        .addField(i18n.__('play.embed.request'), song.req.tag, true)
        .setFooter(`${i18n.__('play.embed.views')} ${song.views} | ${song.ago}`);
      return message.channel.send(embed);
    }

    // If Queue doesn't exist create one
    const queueConstruct: IQueue = {
      textChannel: message.channel,
      voiceChannel: channel,
      connection: null,
      songs: [],
      volume: 80,
      playing: true,
      loop: false
    };
    queueConstruct.songs.push(song);
    queue.set(message.guild!.id, queueConstruct);

    try {
      const connection = await channel.join();
      queueConstruct.connection = connection;
      play.play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(`${i18n.__('error.join')} ${error}`);
      queue.delete(message.guild!.id);
      await channel.leave();
      return sendError(`${i18n.__('error.join')} ${error}`, message.channel);
    }
  }
} as Command;
