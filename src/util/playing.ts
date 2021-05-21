import { Message, MessageEmbed, StreamType, User } from 'discord.js';
import ytdlDiscord from 'discord-ytdl-core';
import pMS from 'pretty-ms';
import scdl from 'soundcloud-downloader/dist/index';
import spdl from 'spdl-core';

import { queue as Queue } from '../index';
import sendError from '../util/error';
import play from './playing';

export default {
  async play(song: Song, message: Message): Promise<void> {
    const queue = Queue.get(message.guild!.id);
    if (!song) {
      Queue.delete(message.guild!.id);
      return;
    }
    let stream;
    let streamType: StreamType;

    try {
      if (song.url.includes('soundcloud.com')) {
        try {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS);
          streamType = 'opus';
        } catch (error) {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3);
          streamType = 'unknown';
        }
      } else if (song.url.includes('youtube.com')) {
        // Don't filter audioonly when live
        if (song.live) {
          stream = await ytdlDiscord(song.url, {
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            opusEncoded: true
          });
        } else {
          stream = await ytdlDiscord(song.url, {
            filter: 'audioonly',
            quality: 'highestaudio',
            highWaterMark: 1 << 25,
            opusEncoded: true
          });
        }
        streamType = 'opus';
        stream.on('error', function (err: Error) {
          if (err && queue) {
            play.play(queue.songs[0], message);
            return sendError(
              `An unexpected error has occurred.\nPossible type \`${err}\``,
              message.channel
            );
          }
        });
      } else if (song.url.includes('spotify.com')) {
        stream = await spdl(song.url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          opusEncoded: true
        });
        streamType = 'opus';
        stream.on('error', function (err: Error) {
          if (err && queue) {
            play.play(queue.songs[0], message);
            return sendError(
              `An unexpected error has occurred.\nPossible type \`${err}\``,
              message.channel
            );
          }
        });
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        play.play(queue.songs[0], message);
      }
    }

    queue!.connection!.on('disconnect', () => Queue.delete(message.guild!.id));

    const dispatcher = queue!
      .connection!.play(stream, { type: streamType! })
      .on('finish', () => {
        const shifted = queue!.songs.shift();
        if (queue!.loop === true) {
          queue!.songs.push(shifted!);
        }
        play.play(queue!.songs[0], message);
      })
      .on('error', (err: Error) => {
        console.error(err);
        queue!.songs.shift();
        play.play(queue!.songs[0], message);
      });

    dispatcher.setVolumeLogarithmic(queue!.volume / 100);

    const thing = new MessageEmbed()
      .setAuthor(
        'Started Playing Music!',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField('Name', song.title, true)
      .addField('Duration', song.live ? 'LIVE' : pMS(song.duration), true)
      .addField('Requested by', song.req.tag, true)
      .setFooter(`Views: ${song.views} | ${song.ago}`);
    queue!.textChannel.send(thing);
  }
};
export interface Song {
  id: string;
  title: string;
  views: string;
  url: string;
  ago: string;
  /** Duration in ms */
  duration: number;
  img: string;
  live?: boolean;
  req: User;
}
