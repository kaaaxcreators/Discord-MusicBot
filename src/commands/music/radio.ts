import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Client, Collection, Message, MessageEmbed } from 'discord.js';
import i18next from 'i18next';
import fetch, { Response } from 'node-fetch';
import pMS from 'pretty-ms';

import { Command, queue, Stats } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';
import { MusicSubscription, Track } from '../../util/Music';

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
          ? Array.from(message.attachments)[0][1]
          : undefined
        : undefined
      : undefined;
    if ((searchString || attachment) == null) {
      return sendError(i18next.t('radio.missingargs'), message.channel);
    }
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : attachment ? attachment.url : '';
    const name = attachment ? (attachment.name ? attachment.name : attachment.url) : url;
    let subscription = queue.get(message.guild!.id);

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

    const oldQueue = !!subscription;

    const song = new Track({
      id: 'radio',
      title: songInfo.get('icy-name') ? songInfo.get('icy-name')! : name,
      views: '-',
      url: url,
      ago: '-',
      duration: 0,
      img: 'https://no.valid/image',
      live: true,
      req: message.author,
      onStart(info) {
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('music.started'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(info.img)
          .setColor('BLUE')
          .addField(i18next.t('music.name'), `[${info.title}](${info.url})`, true)
          .addField(
            i18next.t('music.duration'),
            info.live
              ? i18next.t('nowplaying.live')
              : pMS(info.duration, { secondsDecimalDigits: 0 }),
            true
          )
          .addField(i18next.t('music.request'), info.req.tag, true)
          .setFooter(`${i18next.t('music.views')} ${info.views} | ${info.ago}`);
        message.channel.send({ embeds: [embed] });
      },
      onFinish() {
        Stats.songsPlayed++;
      },
      onError(error) {
        console.error(error);
        return sendError(error.message, message.channel);
      }
    });

    if (!subscription) {
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: channel.id,
          guildId: channel.guild.id,
          adapterCreator: channel.guild.voiceAdapterCreator
        }),
        channel,
        message.channel
      );
      subscription.voiceConnection.on('error', (error) => {
        console.warn(error);
      });
      queue.set(message.guild!.id, subscription);
    }
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
    } catch (error) {
      console.error(error);
      return sendError('Failed to Join the Voice Channel within 10 seconds', message.channel);
    }

    subscription.enqueue(song);

    if (oldQueue) {
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
  }
} as Command;
