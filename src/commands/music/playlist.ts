import { Client, Message, MessageEmbed, MessageEmbedOptions, Util, VoiceChannel } from 'discord.js';
import i18n from 'i18n';
import spdl from 'spdl-core';
import { getTracks } from 'spotify-url-info';
import yts from 'yt-search';
import ytpl from 'ytpl';

import { Command, config, IQueue, queue } from '../../index';
import console from '../../util/logger';
i18n.setLocale(config.LOCALE);
import { getPrefix } from '../../util/database';
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
      channel: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'EMBED_LINKS',
        'CONNECT',
        'SPEAK',
        'MANAGE_MESSAGES'
      ],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
    if (!channel) {
      return sendError(i18n.__('error.needvc'), message.channel);
    }
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const searchString = args.join(' ');

    if (!searchString || !url) {
      return sendError(
        i18n.__mf('playlist.missingargs', { prefix: await getPrefix(message) }),
        message.channel
      );
    }
    const searchtext = await message.channel.send({
      embed: { description: i18n.__('searching') } as MessageEmbedOptions
    });
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      try {
        const playlist = await ytpl(url);
        if (!playlist) {
          return sendError(i18n.__('playlist.notfound.notfound'), message.channel);
        }
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel);
        }
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(playlist.bestThumbnail.url!)
          .setColor('GREEN')
          .setDescription(
            i18n.__mf('playlist.added', { playlist: playlist.title, videos: videos.length })
          );
        return searchtext.editable ? searchtext.edit(embed) : message.channel.send(embed);
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18n.__('playlist.notfound.notfound'), message.channel).catch(
          console.error
        );
      }
    } else if (spdl.validateURL(url, 'playlist')) {
      try {
        const playlist = (await getTracks(url)).map((value) => value.external_urls.spotify);
        const songInfo = await spdl.getInfo(playlist[0]);
        for (const video of playlist) {
          const infos = await spdl.getInfo(video);
          await handleSpotify(infos, message, channel); // eslint-disable-line no-await-in-loop
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
        return searchtext.editable ? searchtext.edit(embed) : message.channel.send(embed);
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18n.__('error.occurred'), message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);

        if (searched.playlists.length === 0) {
          return sendError(i18n.__('playlist.notfound.youtube'), message.channel);
        }
        const songInfo = searched.playlists[0];
        const listurl = songInfo.listId;
        const playlist = await ytpl(listurl);
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel);
        }
        const embed = new MessageEmbed()
          .setAuthor(
            i18n.__('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(i18n.__mf('paylist.added', { playlist: songInfo.title, videos: length }));
        return searchtext.editable ? searchtext.edit(embed) : message.channel.send(embed);
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18n.__('error.occurred'), message.channel).catch(console.error);
      }
    }

    async function handleVideo(video: ytpl.Item, message: Message, channel: VoiceChannel) {
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
        return serverQueue.songs.push(song);
      }
      return;
    }

    async function handleSpotify(video: spdl.trackInfo, message: Message, channel: VoiceChannel) {
      const serverQueue = queue.get(message.guild!.id);
      const song: Song = {
        id: video.id,
        title: `[${Util.escapeMarkdown(video.title)}](${video.url})`,
        views: '-',
        ago: '-',
        duration: video.duration ? video.duration : 0,
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
        return serverQueue.songs.push(song);
      }
      return;
    }
  }
} as Command;
