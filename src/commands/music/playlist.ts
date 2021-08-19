import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import {
  Client,
  Message,
  MessageEmbed,
  MessageEmbedOptions,
  StageChannel,
  VoiceChannel
} from 'discord.js';
import i18next from 'i18next';
import pMS from 'pretty-ms';
import spdl from 'spdl-core';
import { getTracks } from 'spotify-url-info';
import yts from 'yt-search';
import ytpl from 'ytpl';

import { Command, queue, Stats } from '../../index';
import { getPrefix } from '../../util/database';
import sendError from '../../util/error';
import console from '../../util/logger';
import { MusicSubscription, Track } from '../../util/Music';
module.exports = {
  info: {
    name: 'playlist',
    description: i18next.t('playlist.description'),
    usage: i18next.t('playlist.usage'),
    aliases: ['pl'],
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
    const channel = message.member!.voice.channel!;
    if (!channel) {
      return sendError(i18next.t('error.needvc'), message.channel);
    }
    const url = args[0] ? args[0].replace(/<(.+)>/g, '$1') : '';
    const searchString = args.join(' ');

    if (!searchString || !url) {
      return sendError(
        i18next.t('playlist.missingargs', { prefix: await getPrefix(message) }),
        message.channel
      );
    }
    const searchtext = await message.channel.send({
      embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions]
    });
    if (url.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
      try {
        const playlist = await ytpl(url);
        if (!playlist) {
          return sendError(i18next.t('playlist.notfound.notfound'), message.channel);
        }
        await handleVideo(
          playlist.items.map((v) => v.url),
          message,
          channel
        );
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(playlist.bestThumbnail.url!)
          .setColor('GREEN')
          .setDescription(
            i18next.t('playlist.added', { playlist: playlist.title, videos: playlist.items.length })
          );
        return searchtext.editable
          ? searchtext.edit({ embeds: [embed] })
          : message.channel.send({ embeds: [embed] });
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18next.t('playlist.notfound.notfound'), message.channel).catch(
          console.error
        );
      }
    } else if (spdl.validateURL(url, 'playlist')) {
      try {
        const playlist: string[] = (await getTracks(url)).map(
          (value) => value.external_urls.spotify
        );
        const songInfo = await spdl.getInfo(playlist[0]);
        handleVideo(playlist, message, channel);
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(
            i18next.t('playlist.added', { playlist: songInfo.title, videos: playlist.length })
          );
        return searchtext.editable
          ? searchtext.edit({ embeds: [embed] })
          : message.channel.send({ embeds: [embed] });
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18next.t('error.occurred'), message.channel).catch(console.error);
      }
    } else {
      try {
        const searched = await yts.search(searchString);

        if (searched.playlists.length === 0) {
          return sendError(i18next.t('playlist.notfound.youtube'), message.channel);
        }
        const songInfo = searched.playlists[0];
        const listurl = songInfo.listId;
        const playlist = await ytpl(listurl);
        await handleVideo(
          playlist.items.map((v) => v.url),
          message,
          channel
        );
        const embed = new MessageEmbed()
          .setAuthor(
            i18next.t('playlist.embed.author'),
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          )
          .setThumbnail(songInfo.thumbnail)
          .setColor('GREEN')
          .setDescription(i18next.t('paylist.added', { playlist: songInfo.title, videos: length }));
        return searchtext.editable
          ? searchtext.edit({ embeds: [embed] })
          : message.channel.send({ embeds: [embed] });
      } catch (error) {
        if (searchtext.deletable) {
          searchtext.delete();
        }
        return sendError(i18next.t('error.occurred'), message.channel).catch(console.error);
      }
    }

    async function handleVideo(
      /** Array of URL */
      urls: string[],
      message: Message,
      channel: VoiceChannel | StageChannel
    ) {
      let subscription = queue.get(message.guild!.id);
      const oldQueue = !!subscription;
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

      for (const url of urls) {
        try {
          const track = await Track.from([url], message, {
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
              // if oldQueue then don't edit message
              searchtext.editable && !oldQueue
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
        } catch (error) {
          console.error(error);
          sendError(error.message, message.channel);
          continue;
        }
      }
    }
  }
} as Command;
