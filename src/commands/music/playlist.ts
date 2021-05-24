import { Client, Message, MessageEmbed, Util, VoiceChannel } from 'discord.js';
import i18n from 'i18n';
import pMS from 'pretty-ms';
import spdl from 'spdl-core';
import { getTracks } from 'spotify-url-info';
import yts from 'yt-search';
import ytpl from 'ytpl';

import { Command, config, IQueue, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import play, { Song } from '../../util/playing';
module.exports = {
  info: {
    name: 'playlist',
    description: i18n.__('playlist.description'),
    usage: i18n.__('playlist.usage'),
    aliases: ['pl'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
    if (!channel) return sendError(i18n.__('error.needvc'), message.channel);
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const searchString = args.join(' ');

    if (!searchString || !url)
      return sendError(
        i18n.__mf('playlist.missingargs', { prefix: config.prefix }),
        message.channel
      );
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      try {
        const playlist = await ytpl(url);
        if (!playlist) return sendError(i18n.__('playlist.notfound.notfound'), message.channel);
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel, true);
        }
        return message.channel.send({
          embed: {
            color: 'GREEN',
            description: i18n.__mf('playlist.added', {
              playlist: playlist.title,
              videos: videos.length
            })
          }
        });
      } catch (error) {
        console.error(error);
        return sendError(i18n.__('playlist.notfound.notfound'), message.channel).catch(
          console.error
        );
      }
    } else if (url.match(/(^https?:\/\/open\.spotify\.com\/playlist\/)([a-z,A-Z,0-9]+)?.*$/gi)) {
      try {
        const tracks = await getTracks(url);
        const playlist = tracks.map((value) => value.external_urls.spotify);
        const songInfo = await spdl.getInfo(playlist[0]);
        for (const video of playlist) {
          const infos = await spdl.getInfo(video);
          await handleSpotify(infos, message, channel, true); // eslint-disable-line no-await-in-loop
        }
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(
            i18n.__mf('playlist.added', { playlist: songInfo.title, videos: playlist.length })
          );
        return message.channel.send(embed);
      } catch (error) {
        return sendError(i18n.__('error.occurred'), message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);

        if (searched.playlists.length === 0)
          return sendError(i18n.__('playlist.notfound.youtube'), message.channel);
        const songInfo = searched.playlists[0];
        const listurl = songInfo.listId;
        const playlist = await ytpl(listurl);
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel, true);
        }
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(i18n.__mf('paylist.added', { playlist: songInfo.title, videos: length }));
        return message.channel.send(embed);
      } catch (error) {
        return sendError(i18n.__('error.occurred'), message.channel).catch(console.error);
      }
    }

    async function handleVideo(
      video: ytpl.Item,
      message: Message,
      channel: VoiceChannel,
      playlist = false
    ) {
      const serverQueue = queue.get(message.guild!.id);
      const song: Song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        views: '-',
        ago: '-',
        duration: video.durationSec! * 1000,
        url: `https://www.youtube.com/watch?v=${video.id}`,
        img: video.thumbnails[0].url!,
        req: message.author
      };
      if (!serverQueue) {
        const queueConstruct: IQueue = {
          textChannel: message.channel,
          voiceChannel: channel,
          connection: null,
          songs: [],
          volume: 80,
          playing: true,
          loop: false
        };
        queue.set(message.guild!.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
          const connection = await channel.join();
          queueConstruct.connection = connection;
          play.play(queueConstruct.songs[0], message);
        } catch (error) {
          console.error(`${i18n.__('error.join')} ${error}`);
          queue.delete(message.guild!.id);
          return sendError(`${i18n.__('error.join')} ${error}`, message.channel);
        }
      } else {
        serverQueue.songs.push(song);
        // If Playlist don't send message for each Song
        if (playlist) return;
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('play.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(song.img)
          .setColor('YELLOW')
          .addField(i18n.__('play.embed.name'), song.title, true)
          .addField(i18n.__('play.embed.duration'), pMS(song.duration), true)
          .addField(i18n.__('play.embed.request'), song.req.tag, true)
          .setFooter(`${i18n.__('play.embed.views')} ${song.views} | ${song.ago}`);
        return message.channel.send(embed);
      }
      return;
    }

    async function handleSpotify(
      video: spdl.trackInfo,
      message: Message,
      channel: VoiceChannel,
      playlist = false
    ) {
      const serverQueue = queue.get(message.guild!.id);
      const song: Song = {
        id: video.id,
        title: Util.escapeMarkdown(video.title),
        views: '-',
        ago: '-',
        duration: video.duration!,
        url: video.url,
        img: video.thumbnail,
        req: message.author
      };
      if (!serverQueue) {
        const queueConstruct: IQueue = {
          textChannel: message.channel,
          voiceChannel: channel,
          connection: null,
          songs: [],
          volume: 80,
          playing: true,
          loop: false
        };
        queue.set(message.guild!.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
          const connection = await channel.join();
          queueConstruct.connection = connection;
          play.play(queueConstruct.songs[0], message);
        } catch (error) {
          console.error(`${i18n.__('error.join')} ${error}`);
          queue.delete(message.guild!.id);
          return sendError(`${i18n.__('error.join')} ${error}`, message.channel);
        }
      } else {
        serverQueue.songs.push(song);
        // If Playlist don't send message for each Song
        if (playlist) return;
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('play.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(song.img)
          .setColor('YELLOW')
          .addField(i18n.__('play.embed.name'), song.title, true)
          .addField(i18n.__('play.embed.duration'), pMS(song.duration), true)
          .addField(i18n.__('play.embed.request'), song.req.tag, true)
          .setFooter(`${i18n.__('play.embed.views')} ${song.views} | ${song.ago}`);
        return message.channel.send(embed);
      }
      return;
    }
  }
} as Command;
