import { Client, Message, MessageEmbed, Util, VoiceChannel } from 'discord.js';
import pMS from 'pretty-ms';
import spdl from 'spdl-core';
import { getTracks } from 'spotify-url-info';
import yts from 'yt-search';
import ytpl from 'ytpl';

import { config, IQueue, queue } from '../index';
import sendError from '../util/error';
import play, { Song } from '../util/playing';
module.exports = {
  info: {
    name: 'playlist',
    description: 'To play songs :D',
    usage: '<YouTube Playlist URL> | <Spotify Playlist URL> | <Playlist Name>',
    aliases: ['pl']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const searchString = args.join(' ');
    const permissions = channel.permissionsFor(message.client.user!);
    if (!permissions!.has('CONNECT'))
      return sendError(
        'I cannot connect to your voice channel, make sure I have the proper permissions!',
        message.channel
      );
    if (!permissions!.has('SPEAK'))
      return sendError(
        'I cannot speak in this voice channel, make sure I have the proper permissions!',
        message.channel
      );

    if (!searchString || !url)
      return sendError(
        `Usage: ${config.prefix}playlist <YouTube Playlist URL | Playlist Name>`,
        message.channel
      );
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      try {
        const playlist = await ytpl(url);
        if (!playlist) return sendError('Playlist not found', message.channel);
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel, true);
        }
        return message.channel.send({
          embed: {
            color: 'GREEN',
            description: `✅  **|**  Playlist: **\`${playlist.title}\`** has added \`${videos.length}\` videos to the queue`
          }
        });
      } catch (error) {
        console.error(error);
        return sendError('Playlist not found :(', message.channel).catch(console.error);
      }
    } else if (url.match(/(^https?:\/\/open\.spotify\.com\/playlist\/)([a-z,A-Z,0-9]+)?.*$/gi)) {
      try {
        spdl.setCredentials(config.SPOTIFYID, config.SPOTIFYSECRET);
        const tracks = await getTracks(url);
        const playlist = tracks.map((value) => value.external_urls.spotify);
        const songInfo = await spdl.getInfo(playlist[0]);
        for (const video of playlist) {
          const infos = await spdl.getInfo(video);
          await handleSpotify(infos, message, channel, true); // eslint-disable-line no-await-in-loop
        }
        const thing = new MessageEmbed()
          .setAuthor(
            'Playlist has been added to queue',
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(
            `✅  **|**  Playlist: **\`${songInfo.title}\`** has added \`${playlist.length}\` videos to the queue`
          );
        return message.channel.send(thing);
      } catch (error) {
        return sendError('An unexpected error has occurred', message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);

        if (searched.playlists.length === 0)
          return sendError(
            'Looks like i was unable to find the playlist on YouTube',
            message.channel
          );
        const songInfo = searched.playlists[0];
        const listurl = songInfo.listId;
        const playlist = await ytpl(listurl);
        const videos = await playlist.items;
        for (const video of videos) {
          await handleVideo(video, message, channel, true);
        }
        const thing = new MessageEmbed()
          .setAuthor(
            'Playlist has been added to queue',
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(
            `✅  **|**  Playlist: **\`${songInfo.title}\`** has added \`${videos.length}\` videos to the queue`
          );
        return message.channel.send(thing);
      } catch (error) {
        return sendError('An unexpected error has occurred', message.channel).catch(console.error);
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
          console.error(`I could not join the voice channel: ${error}`);
          queue.delete(message.guild!.id);
          return sendError(`I could not join the voice channel: ${error}`, message.channel);
        }
      } else {
        serverQueue.songs.push(song);
        // If Playlist don't send message for each Song
        if (playlist) return;
        const thing = new MessageEmbed()
          .setAuthor(
            'Song has been added to queue',
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(song.img)
          .setColor('YELLOW')
          .addField('Name', song.title, true)
          .addField('Duration', pMS(song.duration), true)
          .addField('Requested by', song.req.tag, true)
          .setFooter(`Views: ${song.views} | ${song.ago}`);
        return message.channel.send(thing);
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
          console.error(`I could not join the voice channel: ${error}`);
          queue.delete(message.guild!.id);
          return sendError(`I could not join the voice channel: ${error}`, message.channel);
        }
      } else {
        serverQueue.songs.push(song);
        // If Playlist don't send message for each Song
        if (playlist) return;
        const thing = new MessageEmbed()
          .setAuthor(
            'Song has been added to queue',
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(song.img)
          .setColor('YELLOW')
          .addField('Name', song.title, true)
          .addField('Duration', pMS(song.duration), true)
          .addField('Requested by', song.req.tag, true)
          .setFooter(`Views: ${song.views} | ${song.ago}`);
        return message.channel.send(thing);
      }
      return;
    }
  }
};
