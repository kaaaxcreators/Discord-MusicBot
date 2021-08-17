import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Client, Message, MessageEmbed, MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';
import pMS from 'pretty-ms';

import { Command, queue, Stats } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';
import { MusicSubscription, Track } from '../../util/Music';

module.exports = {
  info: {
    name: 'play',
    description: i18next.t('play.description'),
    usage: i18next.t('play.usage'),
    aliases: ['p'],
    categorie: 'music',
    permissions: {
      channel: [
        'VIEW_CHANNEL',
        'SEND_MESSAGES',
        'EMBED_LINKS',
        'CONNECT',
        'SPEAK',
        'MANAGE_MESSAGES'
      ],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel;
    if (!channel) {
      return sendError(i18next.t('error.needvc'), message.channel);
    }

    if (!args.join(' ')) {
      return sendError(i18next.t('play.missingargs'), message.channel);
    }
    let subscription = queue.get(message.guild!.id);

    const searchtext = await message.channel.send({
      embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions]
    });

    let newQueue = false;

    if (!subscription) {
      newQueue = true;
      subscription = new MusicSubscription(
        joinVoiceChannel({
          channelId: message.channel.id,
          guildId: message.guild!.id,
          adapterCreator: channel.guild!.voiceAdapterCreator
        }),
        channel,
        message.channel
      );
    }
    try {
      await entersState(subscription.voiceConnection, VoiceConnectionStatus.Ready, 20e3);
    } catch (error) {
      console.error(error);
      return sendError('Failed to Join the Voice Channel within 10 seconds', message.channel);
    }
    try {
      const track = await Track.from(args, message, {
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
          searchtext.editable
            ? searchtext.edit({ embeds: [embed] })
            : message.channel.send({ embeds: [embed] });
        },
        onFinish() {
          Stats.songsPlayed++;
        },
        onError(error) {
          console.error(error);
          return sendError(error.message, message.channel);
        }
      });
      subscription.enqueue(track);
      if (newQueue) {
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('play.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(track.img!)
          .setColor('YELLOW')
          .addField(i18next.t('play.embed.name'), `[${track.title}](${track.url})`, true)
          .addField(
            i18next.t('play.embed.duration'),
            track.live
              ? i18next.t('nowplaying.live')
              : pMS(track.duration, { secondsDecimalDigits: 0 }),
            true
          )
          .addField(i18next.t('play.embed.request'), track.req.tag, true)
          .setFooter(`${i18next.t('play.embed.views')} ${track.views} | ${track.ago}`);
        searchtext.editable
          ? searchtext.edit({ embeds: [embed] })
          : message.channel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(error);
      return sendError(error.message, message.channel);
    }
  }
} as Command;
