import { Client, Message } from "discord.js";

import { config } from '../index';

const { MessageEmbed } = require('discord.js');
const ytdlDiscord = require('discord-ytdl-core');
const sendError = require('../util/error');
const scdl = require('soundcloud-downloader').default;

export default {
  async play(song, message: Message, client: Client) {
    const queue = message.client.queue.get(message.guild.id);
    if (!song) {
      message.client.queue.delete(message.guild.id);
      return;
    }
    let stream;
    let streamType;

    try {
      if (song.url.includes('soundcloud.com')) {
        try {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.OPUS, config.SOUNDCLOUD);
        } catch (error) {
          stream = await scdl.downloadFormat(song.url, scdl.FORMATS.MP3, config.SOUNDCLOUD);
          streamType = 'unknown';
        }
      } else if (song.url.includes('youtube.com')) {
        stream = await ytdlDiscord(song.url, {
          filter: 'audioonly',
          quality: 'highestaudio',
          highWaterMark: 1 << 25,
          opusEncoded: true
        });
        streamType = 'opus';
        stream.on('error', function (err: Error) {
          if (err) {
            if (queue) {
              module.exports.play(queue.songs[0], message);
              return sendError(
                `An unexpected error has occurred.\nPossible type \`${err}\``,
                message.channel
              );
            }
          }
        });
      }
    } catch (error) {
      if (queue) {
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      }
    }

    queue.connection.on('disconnect', () => message.client.queue.delete(message.guild?.id));

    const dispatcher = queue.connection
      .play(stream, { type: streamType })
      .on('finish', () => {
        const shifted = queue.songs.shift();
        if (queue.loop === true) {
          queue.songs.push(shifted);
        }
        module.exports.play(queue.songs[0], message);
      })
      .on('error', (err: Error) => {
        console.error(err);
        queue.songs.shift();
        module.exports.play(queue.songs[0], message);
      });

    dispatcher.setVolumeLogarithmic(queue.volume / 100);

    let thing = new MessageEmbed()
      .setAuthor(
        'Started Playing Music!',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setThumbnail(song.img)
      .setColor('BLUE')
      .addField('Name', song.title, true)
      .addField('Duration', song.duration, true)
      .addField('Requested by', song.req.tag, true)
      .setFooter(`Views: ${song.views} | ${song.ago}`);
    queue.textChannel.send(thing);
  }
};
