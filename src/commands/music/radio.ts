import { DiscordGatewayAdapterCreator, joinVoiceChannel } from '@discordjs/voice';
import { Client, Collection, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import fetch, { Response } from 'node-fetch';
import pMS from 'pretty-ms';

import { Command, IQueue, queue } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';
import play, { Song } from '../../util/playing';

module.exports = {
  info: {
    name: 'radio',
    description: i18next.t('radio.description'),
    usage: i18next.t('radio.usage'),
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
      return sendError(i18next.t('error.needvc'), message.channel);
    }
    const searchString = args.join(' ');
    const attachment = message.attachments
      ? Array.from(message.attachments)
        ? Array.from(message.attachments)[0]
          ? Array.from(message.attachments)[0][1].url
          : undefined
        : undefined
      : undefined;
    if ((searchString || attachment) == null) {
      return sendError(i18next.t('radio.missingargs'), message.channel);
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
      return sendError(i18next.t('error.something'), message.channel);
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
          i18next.t('radio.embed.author'),
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        )
        .setThumbnail(song.img!)
        .setColor('YELLOW')
        .addField(i18next.t('radio.embed.name'), `[${song.title}](${song.url})`, true)
        .addField(
          i18next.t('radio.embed.duration'),
          song.live
            ? i18next.t('nowplaying.live')
            : pMS(song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18next.t('radio.embed.request'), song.req.tag, true)
        .setFooter(`${i18next.t('radio.embed.views')} ${song.views} | ${song.ago}`);
      return message.channel.send({ embeds: [embed] });
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
      const connection = joinVoiceChannel({
        channelId: channel.id,
        guildId: channel.guild.id,
        adapterCreator: <DiscordGatewayAdapterCreator>channel.guild.voiceAdapterCreator
      });
      queueConstruct.connection = connection;
      play.play(queueConstruct.songs[0], message);
    } catch (error) {
      console.error(`${i18next.t('error.join')} ${error}`);
      queue.delete(message.guild!.id);
      await channel.guild.me?.voice.disconnect();
      return sendError(`${i18next.t('error.join')} ${error}`, message.channel);
    }
  }
} as Command;
