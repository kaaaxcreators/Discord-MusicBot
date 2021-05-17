import { Client, Message, MessageEmbed, Util } from 'discord.js';
import pMS from 'pretty-ms';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';
import yts from 'yt-search';
import ytdl from 'ytdl-core';

import { config, IQueue, queue } from '../index';
import sendError from '../util/error';
import play, { Song } from '../util/playing';

module.exports = {
  info: {
    name: 'play',
    description: 'To play songs :D',
    usage: '<YouTube URL> | <Spotify Track URL> | <Song Name>',
    aliases: ['p']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );

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

    const searchString = args.join(' ');
    if (!searchString) return sendError("You didn't provide what to play", message.channel);
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const serverQueue = queue.get(message.guild!.id);

    let songInfo;
    let song: Song;
    if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/.+$/gi)) {
      try {
        songInfo = await ytdl.getInfo(url);
        if (!songInfo)
          return sendError('Looks like i was unable to find the song on YouTube', message.channel);
        song = {
          id: songInfo.videoDetails.videoId,
          title: songInfo.videoDetails.title,
          url: songInfo.videoDetails.video_url,
          img: songInfo.player_response.videoDetails.thumbnail.thumbnails[0].url,
          duration: Number(songInfo.videoDetails.lengthSeconds) * 1000,
          ago: songInfo.videoDetails.publishDate,
          views: String(songInfo.videoDetails.viewCount).padStart(10, ' '),
          req: message.author
        };
      } catch (error) {
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    } else if (url.match(/^https?:\/\/(soundcloud\.com)\/(.*)$/gi)) {
      try {
        songInfo = await scdl.getInfo(url);
        if (!songInfo)
          return sendError(
            'Looks like i was unable to find the song on SoundCloud',
            message.channel
          );
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
        console.error(error);
        return sendError(error.message, message.channel).catch(console.error);
      }
    } else if (spdl.validateURL(url)) {
      try {
        spdl.setCredentials(config.SPOTIFYID, config.SPOTIFYSECRET);
        songInfo = await spdl.getInfo(url);
        if (!songInfo)
          return sendError('Looks like i was unable to find the song on Spotify', message.channel);
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
        console.error(error);
        return sendError(error.message, message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);
        if (searched.videos.length === 0)
          return sendError('Looks like i was unable to find the song on YouTube', message.channel);

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
        console.error(error);
        return message.reply(error.message).catch(console.error);
      }
    }

    if (serverQueue) {
      serverQueue.songs.push(song);
      const thing = new MessageEmbed()
        .setAuthor(
          'Song has been added to queue',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img!)
        .setColor('YELLOW')
        .addField('Name', song.title, true)
        .addField('Duration', pMS(song.duration), true)
        .addField('Requested by', song.req.tag, true)
        .setFooter(`Views: ${song.views} | ${song.ago}`);
      return message.channel.send(thing);
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
      console.error(`I could not join the voice channel: ${error}`);
      queue.delete(message.guild!.id);
      await channel.leave();
      return sendError(`I could not join the voice channel: ${error}`, message.channel);
    }
  }
};
