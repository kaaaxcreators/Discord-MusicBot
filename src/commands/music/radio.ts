import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Collection, MessageEmbed } from 'discord.js';
import { resolveSrv as resolveSrvCb } from 'dns';
import i18next from 'i18next';
import fetch, { Response } from 'node-fetch';
import pMS from 'pretty-ms';
import { promisify } from 'util';
const resolveSrv = promisify(resolveSrvCb);

import { Command, queue, Stats } from '../../index.js';
import sendError from '../../util/error.js';
import console from '../../util/logger.js';
import { MusicSubscription, Track } from '../../util/Music.js';

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

  run: async function (client, message, args) {
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
    let url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : attachment ? attachment.url : '';
    const name = attachment ? (attachment.name ? attachment.name : attachment.url) : url;
    let subscription = queue.get(message.guild!.id);

    // check if url is a valid url
    if (
      !url ||
      !url.match(
        /((([A-Za-z]{3,9}:(?:\/\/)?)(?:[-;:&=+$,\w]+@)?[A-Za-z0-9.-]+|(?:www.|[-;:&=+$,\w]+@)[A-Za-z0-9.-]+)((?:\/[+~%/.\w-_]*)?\??(?:[-+=&;%@.\w_]*)#?(?:[\w]*))?)/
      )
    ) {
      try {
        url = await stationToURL(searchString);
      } catch (err) {
        console.warn(err);
        return sendError(
          'Looks like i was unable to find the station on radio-browser',
          message.channel
        );
      }
    }

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
  },
  interaction: {
    options: [
      {
        name: 'station',
        description: 'Radio Station to play',
        type: 'STRING',
        required: true
      }
    ],
    run: async (client, interaction, { isGuildMember }) => {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      // Be able to reply after longer than 15 seconds
      interaction.deferReply();
      const channel = interaction.member.voice.channel;
      if (!channel) {
        return sendError(i18next.t('error.needvc'), interaction);
      }
      const station = interaction.options.getString('station', true);
      let subscription = queue.get(interaction.guild!.id);

      const songInfo = new Collection<string, string>();
      const url = await stationToURL(station);
      const data = await fetch(url);
      if (!data.ok) {
        throw new Error('Not Okay!');
      }
      data.headers.forEach((value, key) => songInfo.set(key, value));

      const oldQueue = !!subscription;

      const song = new Track({
        id: 'radio',
        title: songInfo.get('icy-name') ? songInfo.get('icy-name')! : station,
        views: '-',
        url: url,
        ago: '-',
        duration: 0,
        img: 'https://no.valid/image',
        live: true,
        req: interaction.user,
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
          interaction.reply({ embeds: [embed] });
        },
        onFinish() {
          Stats.songsPlayed++;
        },
        onError(error) {
          console.error(error);
          return sendError(error.message, interaction);
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
          interaction.channel!
        );
        subscription.voiceConnection.on('error', (error) => {
          console.warn(error);
        });
        queue.set(interaction.guild!.id, subscription);
      }
      try {
        await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 10e3);
      } catch (error) {
        console.error(error);
        return sendError('Failed to Join the Voice Channel within 10 seconds', interaction);
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
        return interaction.reply({ embeds: [embed] });
      }
    }
  }
} as Command;

async function stationToURL(station: string): Promise<string> {
  const endpoints = await resolveSrv('_api._tcp.radio-browser.info');
  const endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  const fetchResult = await fetch(
    `https://${endpoint.name}/json/stations/search?name=${encodeURIComponent(station)}`,
    {
      headers: {
        'User-Agent': 'github/kaaaxcreators/Discord-MusicBot'
      }
    }
  );
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result: any = await fetchResult.json();
  if (!result || !result.length) {
    throw new Error('No results');
  }
  if (result[0] && result[0].url_resolved) {
    return result[0].url_resolved;
  } else {
    throw new Error('Bad result');
  }
}
