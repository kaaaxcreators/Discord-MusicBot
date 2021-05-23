import { Client, Collection, Message, MessageEmbed } from 'discord.js';
import fetch, { Response } from 'node-fetch';
import pMS from 'pretty-ms';

import { Command, IQueue, queue } from '../../index';
import sendError from '../../util/error';
import play, { Song } from '../../util/playing';

module.exports = {
  info: {
    name: 'radio',
    description: '**[EXPERIMENTAL]** Play any arbitrary stream from URL or Attachment',
    usage: '<Stream URL> | <Attachment>',
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const searchString = args.join(' ');
    const attachment = message.attachments
      ? message.attachments.array()
        ? message.attachments.array()[0]
          ? message.attachments.array()[0].url
          : undefined
        : undefined
      : undefined;
    if ((searchString || attachment) == null)
      return sendError("You didn't provide what to play", message.channel);
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : attachment ? attachment : '';
    const serverQueue = queue.get(message.guild!.id);

    const songInfo = new Collection<string, string>();
    let data: Response;
    try {
      data = await fetch(url);
      if (!data.ok) {
        throw new Error('Not Okay!');
      }
    } catch (err) {
      if (attachment) {
        console.log(url + ': ' + err);
      }
      return sendError('Something went wrong!', message.channel);
    }
    data.headers.forEach((value, key) => songInfo.set(key, value));
    const song: Song = {
      id: 'radio',
      title: songInfo.get('icy-name') ? songInfo.get('icy-name')! : url,
      views: '-',
      url: url,
      ago: '-',
      duration: 0,
      img: 'https://no.valid/image',
      live: true,
      req: message.author
    };
    if (serverQueue) {
      serverQueue.songs.push(song);
      const embed = new MessageEmbed()
        .setAuthor(
          'Song has been added to queue',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img!)
        .setColor('YELLOW')
        .addField('Name', song.title, true)
        .addField('Duration', song.live ? 'LIVE' : pMS(song.duration), true)
        .addField('Requested by', song.req.tag, true)
        .setFooter(`Views: ${song.views} | ${song.ago}`);
      return message.channel.send(embed);
    }

    // If Queue doesn't exist create one
    const queueConstruct: IQueue = {
      textChannel: message.channel,
      voiceChannel: channel!,
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
} as Command;
