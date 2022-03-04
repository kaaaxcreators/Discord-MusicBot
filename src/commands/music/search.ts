import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { Collection, Message, MessageEmbed, MessageEmbedOptions, Util } from 'discord.js';
import i18next from 'i18next';
import millify from 'millify';
import pMS from 'pretty-ms';
import YouTube, { Video } from 'youtube-sr';

import { Command, queue, Stats } from '../../index';
import sendError from '../../util/error';
import console from '../../util/logger';
import { MusicSubscription, Track } from '../../util/Music';
module.exports = {
  info: {
    name: 'search',
    description: i18next.t('search.description'),
    usage: i18next.t('search.usage'),
    aliases: ['sc'],
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

    const searchString = args.join(' ');
    if (!searchString) {
      return sendError(i18next.t('search.missingargs'), message.channel);
    }

    let subscription = queue.get(message.guild!.id);
    let response: Collection<string, Message> = new Collection<string, Message>();
    let video: Video;
    try {
      const searchtext = await message.channel.send({
        embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions]
      });
      const searched = await YouTube.search(searchString, { limit: 10, type: 'video' });
      if (searched[0] == undefined) {
        return sendError(i18next.t('search.notfound'), message.channel);
      }
      let index = 0;
      const embed = new MessageEmbed()
        .setColor('BLUE')
        .setAuthor({
          name: i18next.t('search.result.author', { args: args.join(' ') }),
          iconURL: message.author.displayAvatarURL()
        })
        .setDescription(
          `${searched
            .map(
              (video) =>
                `**\`${++index}\`  |** [\`${video.title}\`](${video.url}) - \`${
                  video.durationFormatted
                }\``
            )
            .join('\n')}`
        )
        .setFooter({ text: i18next.t('search.result.footer') });
      (searchtext.editable
        ? searchtext.edit({ embeds: [embed] })
        : message.channel.send({ embeds: [embed] })
      ).then((m) => setTimeout(() => m.delete(), 15000));
      try {
        response = await message.channel.awaitMessages({
          max: 1,
          time: 20000,
          errors: ['time'],
          filter: (message) => message.content.length > 0 && message.content.length < 11
        });
      } catch (err) {
        // console.error(err); spams console when user doesn't select anything
        return message.channel.send({
          embeds: [
            {
              color: 'RED',
              description: i18next.t('search.selected')!
            }
          ]
        });
      }
      const videoIndex = parseInt(response.first()!.content);
      video = searched[videoIndex - 1];
    } catch (err) {
      console.error(err);
      return message.channel.send({
        embeds: [
          {
            color: 'RED',
            description: i18next.t('search.noresults')!
          }
        ]
      });
    }

    const songInfo = video;

    const oldQueue = !!subscription;

    const song = new Track({
      id: songInfo.id!,
      title: Util.escapeMarkdown(songInfo.title!),
      views: millify(songInfo.views),
      ago: songInfo.uploadedAt!,
      duration: songInfo.duration,
      url: `https://www.youtube.com/watch?v=${songInfo.id}`,
      img: songInfo.thumbnail!.url!,
      req: message.author,
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
        .setAuthor({
          name: i18next.t('play.embed.author'),
          iconURL:
            'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        })
        .setThumbnail(song.img)
        .setColor('YELLOW')
        .addField(i18next.t('play.embed.name'), `[${song.title}](${song.url})`, true)
        .addField(
          i18next.t('play.embed.duration'),
          pMS(song.duration, { secondsDecimalDigits: 0 }),
          true
        )
        .addField(i18next.t('play.embed.request'), song.req.tag, true)
        .setFooter({ text: `${i18next.t('play.embed.views')} ${song.views} | ${song.ago}` });
      return message.channel.send({ embeds: [embed] });
    }
  },
  interaction: {
    options: [
      {
        name: 'search',
        description: 'Name of song to search',
        type: 'STRING',
        required: true
      }
    ],
    run: async (client, interaction, { isGuildMember, isMessage }) => {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      const channel = interaction.member.voice.channel!;
      if (!channel) {
        return sendError(i18next.t('error.needvc'), interaction);
      }

      const search = interaction.options.getString('search', true);

      let subscription = queue.get(interaction.guild!.id);
      let response: Collection<string, Message> = new Collection<string, Message>();
      let video: Video;
      try {
        const searchtext = await interaction.reply({
          embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions],
          fetchReply: true
        });
        if (!isMessage(searchtext)) {
          return;
        }
        const searched = await YouTube.search(search, { limit: 10, type: 'video' });
        if (searched[0] == undefined) {
          return sendError(i18next.t('search.notfound'), interaction);
        }
        let index = 0;
        const embed = new MessageEmbed()
          .setColor('BLUE')
          .setAuthor({
            name: i18next.t('search.result.author', { args: search }),
            iconURL: interaction.user.displayAvatarURL()
          })
          .setDescription(
            `${searched
              .map(
                (video) =>
                  `**\`${++index}\`  |** [\`${video.title}\`](${video.url}) - \`${
                    video.durationFormatted
                  }\``
              )
              .join('\n')}`
          )
          .setFooter({ text: i18next.t('search.result.footer') });
        (searchtext.editable
          ? searchtext.edit({ embeds: [embed] })
          : interaction.followUp({ embeds: [embed], fetchReply: true })
        ).then((m) =>
          setTimeout(() => {
            if (isMessage(m)) {
              m.delete();
            }
          }, 15000)
        );
        try {
          if (!interaction.channel) {
            return;
          }
          response = await interaction.channel.awaitMessages({
            max: 1,
            time: 20000,
            errors: ['time'],
            filter: (message) => message.content.length > 0 && message.content.length < 11
          });
        } catch (err) {
          // console.error(err); spams console when user doesn't select anything
          return interaction.followUp({
            embeds: [
              {
                color: 'RED',
                description: i18next.t('search.selected')!
              }
            ]
          });
        }
        const videoIndex = parseInt(response.first()!.content);
        video = searched[videoIndex - 1];
      } catch (err) {
        console.error(err);
        return interaction.followUp({
          embeds: [
            {
              color: 'RED',
              description: i18next.t('search.noresults')!
            }
          ]
        });
      }

      const songInfo = video;

      const oldQueue = !!subscription;

      const song = new Track({
        id: songInfo.id!,
        title: Util.escapeMarkdown(songInfo.title!),
        views: millify(songInfo.views),
        ago: songInfo.uploadedAt!,
        duration: songInfo.duration,
        url: `https://www.youtube.com/watch?v=${songInfo.id}`,
        img: songInfo.thumbnail!.url!,
        req: interaction.user,
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
          interaction.channel
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
          .setAuthor({
            name: i18next.t('play.embed.author'),
            iconURL:
              'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
          })
          .setThumbnail(song.img)
          .setColor('YELLOW')
          .addField(i18next.t('play.embed.name'), `[${song.title}](${song.url})`, true)
          .addField(
            i18next.t('play.embed.duration'),
            pMS(song.duration, { secondsDecimalDigits: 0 }),
            true
          )
          .addField(i18next.t('play.embed.request'), song.req.tag, true)
          .setFooter({ text: `${i18next.t('play.embed.views')} ${song.views} | ${song.ago}` });
        return interaction.followUp({ embeds: [embed] });
      }
    }
  }
} as Command;
