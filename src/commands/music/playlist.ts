import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import {
  CommandInteraction,
  Message,
  MessageEmbed,
  MessageEmbedOptions,
  StageChannel,
  VoiceChannel
} from 'discord.js';
import i18next from 'i18next';
import pMS from 'pretty-ms';
import spdl from 'spdl-core';
import { getTracks, Tracks } from 'spotify-url-info';
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
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS', 'CONNECT', 'SPEAK'],
      member: []
    }
  },

  run: async function (client, message, args) {
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
        await handleVideo(playlist.items, message, channel, searchtext);
        const embed = new MessageEmbed()
          .setAuthor({
            name: i18next.t('playlist.embed.author'),
            iconURL:
              'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          })
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
        const playlist = await getTracks(url);
        const songInfo = await spdl.getInfo(playlist[0].external_urls.spotify);
        handleVideo(playlist, message, channel, searchtext);
        const embed = new MessageEmbed()
          .setAuthor({
            name: i18next.t('playlist.embed.author'),
            iconURL:
              'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          })
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
        await handleVideo(playlist.items, message, channel, searchtext);
        const embed = new MessageEmbed()
          .setAuthor({
            name: i18next.t('playlist.embed.author'),
            iconURL:
              'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          })
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
  },
  interaction: {
    options: [
      {
        name: 'playlist',
        description: 'Playlist to play',
        type: 'STRING',
        required: true
      }
    ],
    run: async function (client, interaction, { isGuildMember, isMessage }) {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      const channel = interaction.member.voice.channel!;
      if (!channel) {
        return sendError(i18next.t('error.needvc'), interaction);
      }
      const playlistUrlOrText = interaction.options.getString('playlist', true);

      const searchtext = await interaction.reply({
        embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions],
        fetchReply: true
      });
      if (!isMessage(searchtext)) {
        return;
      }
      if (playlistUrlOrText.match(/^https?:\/\/(www.youtube.com|youtube.com)\/playlist(.*)$/)) {
        try {
          const playlist = await ytpl(playlistUrlOrText);
          if (!playlist) {
            return sendError(i18next.t('playlist.notfound.notfound'), interaction);
          }
          await handleVideo(playlist.items, interaction, channel, searchtext);
          const embed = new MessageEmbed()
            .setAuthor({
              name: i18next.t('playlist.embed.author'),
              iconURL:
                'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            })
            .setThumbnail(playlist.bestThumbnail.url!)
            .setColor('GREEN')
            .setDescription(
              i18next.t('playlist.added', {
                playlist: playlist.title,
                videos: playlist.items.length
              })
            );
          return searchtext.editable
            ? searchtext.edit({ embeds: [embed] })
            : interaction.followUp({ embeds: [embed] });
        } catch (error) {
          if (searchtext.deletable) {
            searchtext.delete();
          }
          return sendError(i18next.t('playlist.notfound.notfound'), interaction);
        }
      } else if (spdl.validateURL(playlistUrlOrText, 'playlist')) {
        try {
          const playlist = await getTracks(playlistUrlOrText);
          const songInfo = await spdl.getInfo(playlist[0].external_urls.spotify);
          handleVideo(playlist, interaction, channel, searchtext);
          const embed = new MessageEmbed()
            .setAuthor({
              name: i18next.t('playlist.embed.author'),
              iconURL:
                'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            })
            .setThumbnail(songInfo.thumbnail)
            .setColor('GREEN')
            .setDescription(
              i18next.t('playlist.added', { playlist: songInfo.title, videos: playlist.length })
            );
          return searchtext.editable
            ? searchtext.edit({ embeds: [embed] })
            : interaction.followUp({ embeds: [embed] });
        } catch (error) {
          if (searchtext.deletable) {
            searchtext.delete();
          }
          return sendError(i18next.t('error.occurred'), interaction);
        }
      } else {
        try {
          const searched = await yts.search(playlistUrlOrText);

          if (searched.playlists.length === 0) {
            return sendError(i18next.t('playlist.notfound.youtube'), interaction);
          }
          const songInfo = searched.playlists[0];
          const listurl = songInfo.listId;
          const playlist = await ytpl(listurl);
          await handleVideo(playlist.items, interaction, channel, searchtext);
          const embed = new MessageEmbed()
            .setAuthor({
              name: i18next.t('playlist.embed.author'),
              iconURL:
                'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            })
            .setThumbnail(songInfo.thumbnail)
            .setColor('GREEN')
            .setDescription(
              i18next.t('paylist.added', { playlist: songInfo.title, videos: length })
            );
          return searchtext.editable
            ? searchtext.edit({ embeds: [embed] })
            : interaction.followUp({ embeds: [embed] });
        } catch (error) {
          if (searchtext.deletable) {
            searchtext.delete();
          }
          return sendError(i18next.t('error.occurred'), interaction);
        }
      }
    }
  }
} as Command;

async function handleVideo(
  /** Array of Items */
  items: ytpl.Item[] | Tracks[],
  message: Message | CommandInteraction,
  channel: VoiceChannel | StageChannel,
  searchtext: Message
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
      message.channel!
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
    return sendError(
      'Failed to Join the Voice Channel within 10 seconds',
      isCommandInteraction(message) ? message : message.channel
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function instanceOfytplItem(object: any): object is ytpl.Item {
    return 'index' in object;
  }

  for (const item of items) {
    try {
      const partial = instanceOfytplItem(item)
        ? {
            id: item.id,
            title: item.title,
            url: item.url,
            img: item.bestThumbnail.url || '',
            duration: (item.durationSec || 0) * 1000,
            ago: '-',
            views: '-'
          }
        : {
            id: item.id,
            title: item.name,
            url: item.external_urls.spotify,
            img: item.preview_url,
            duration: item.duration_ms,
            ago: '-',
            views: '-'
          };
      const track = new Track({
        ...partial,
        req: isCommandInteraction(message) ? message.user : message.author,
        onStart(info) {
          const embed = new MessageEmbed()
            .setAuthor({
              name: i18next.t('music.started'),
              iconURL:
                'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
            })
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
            .setFooter({ text: `${i18next.t('music.views')} ${info.views} | ${info.ago}` });
          // if oldQueue then don't edit message
          searchtext.editable && !oldQueue
            ? searchtext.edit({ embeds: [embed] })
            : isCommandInteraction(message)
            ? message.followUp({ embeds: [embed] })
            : message.channel.send({ embeds: [embed] });
        },
        onFinish() {
          Stats.songsPlayed++;
        },
        onError(error) {
          console.error(error);
          return sendError(
            error.message,
            isCommandInteraction(message) ? message : message.channel
          );
        }
      });
      subscription.enqueue(track);
      const embed = new MessageEmbed()
        .setAuthor({
          name: i18next.t('play.embed.author'),
          iconURL:
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        })
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
        .setFooter({ text: `${i18next.t('play.embed.views')} ${track.views} | ${track.ago}` });
      searchtext.editable
        ? searchtext.edit({ embeds: [embed] })
        : isCommandInteraction(message)
        ? message.followUp({ embeds: [embed] })
        : message.channel.send({ embeds: [embed] });
    } catch (error) {
      if (error instanceof Error) {
        console.error(error);
        sendError(error.message, isCommandInteraction(message) ? message : message.channel);
      }
      continue;
    }
  }
}

function isCommandInteraction(a: Message | CommandInteraction): a is CommandInteraction {
  return 'followUp' in a;
}
