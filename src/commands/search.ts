import { Client, Collection, Message, MessageEmbed, Util } from 'discord.js';
import pMS from 'pretty-ms';
import YouTube, { Video } from 'youtube-sr';

import { IQueue, queue } from '../index';
import sendError from '../util/error';
import play, { Song } from '../util/playing';
module.exports = {
  info: {
    name: 'search',
    description: 'To search songs :D',
    usage: '<song_name>',
    aliases: ['sc']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
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
    if (!searchString) return sendError("You didn't provide what to search", message.channel);

    const serverQueue = queue.get(message.guild!.id);
    let response: Collection<string, Message> = new Collection<string, Message>();
    let video: Video;
    try {
      const searched = await YouTube.search(searchString, { limit: 10, type: 'video' });
      if (searched[0] == undefined)
        return sendError('Looks like i was unable to find the song on YouTube', message.channel);
      let index = 0;
      const embedPlay = new MessageEmbed()
        .setColor('BLUE')
        .setAuthor(`Results for "${args.join(' ')}"`, message.author.displayAvatarURL())
        .setDescription(
          `${searched
            .map(
              (video) =>
                `**\`${++index}\`  |** [\`${video.title}\`](${video.url}) - \`${
                  video.durationFormatted
                }\``
            )
            .join('\n')}`
        )
        .setFooter('Type the number of the song to add it to the playlist');
      message.channel.send(embedPlay).then((m) =>
        m.delete({
          timeout: 15000
        })
      );
      try {
        response = await message.channel.awaitMessages(
          (message) => message.content > 0 && message.content < 11,
          {
            max: 1,
            time: 20000,
            errors: ['time']
          }
        );
      } catch (err) {
        console.error(err);
        return message.channel.send({
          embed: {
            color: 'RED',
            description:
              'Nothing has been selected within 20 seconds, the request has been canceled.'
          }
        });
      }
      const videoIndex = parseInt(response.first()!.content);
      video = searched[videoIndex - 1];
    } catch (err) {
      console.error(err);
      return message.channel.send({
        embed: {
          color: 'RED',
          description: '🆘  **|**  I could not obtain any search results'
        }
      });
    }

    // response.clear();
    const songInfo = video;

    const song: Song = {
      id: songInfo.id!,
      title: Util.escapeMarkdown(songInfo.title!),
      views: String(songInfo.views).padStart(10, ' ').trim(),
      ago: songInfo.uploadedAt!,
      duration: songInfo.duration,
      url: `https://www.youtube.com/watch?v=${songInfo.id}`,
      img: songInfo.thumbnail!.url!,
      req: message.author
    };

    if (serverQueue) {
      serverQueue.songs.push(song);
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
      await channel.leave();
      return sendError(`I could not join the voice channel: ${error}`, message.channel);
    }
  }
};
