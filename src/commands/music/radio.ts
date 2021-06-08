import { Client, Collection, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';
import fetch, { Response } from 'node-fetch';
import pMS from 'pretty-ms';

import { Command, config, IQueue, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import console from '../../util/logger';
import play, { Song } from '../../util/playing';

module.exports = {
  info: {
    name: 'radio',
    description: i18n.__('radio.description'),
    usage: i18n.__('radio.usage'),
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel;
    if (!channel) {
      return sendError(i18n.__('error.needvc'), message.channel);
    }
    const searchString = args.join(' ');
    const attachment = message.attachments
      ? message.attachments.array()
        ? message.attachments.array()[0]
          ? message.attachments.array()[0].url
          : undefined
        : undefined
      : undefined;
    if ((searchString || attachment) == null) {
      return sendError(i18n.__('radio.missingargs'), message.channel);
    }
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
      return sendError(i18n.__('error.something'), message.channel);
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
          i18n.__('radio.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img!)
        .setColor('YELLOW')
        .addField(i18n.__('radio.embed.name'), `[${song.title}](${song.url})`, true)
        .addField(
          i18n.__('radio.embed.duration'),
          song.live ? i18n.__('nowplaying.live') : pMS(song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18n.__('radio.embed.request'), song.req.tag, true)
        .setFooter(`${i18n.__('radio.embed.views')} ${song.views} | ${song.ago}`);
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
      console.error(`${i18n.__('error.join')} ${error}`);
      queue.delete(message.guild!.id);
      await channel.leave();
      return sendError(`${i18n.__('error.join')} ${error}`, message.channel);
    }
  }
} as Command;
