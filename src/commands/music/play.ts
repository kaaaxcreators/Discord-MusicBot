import { entersState, joinVoiceChannel, VoiceConnectionStatus } from '@discordjs/voice';
import { MessageEmbed, MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';
import pMS from 'pretty-ms';

import { Command, queue, Stats } from '../../index.js';
import sendError from '../../util/error.js';
import console from '../../util/logger.js';
import { MusicSubscription, Track } from '../../util/Music.js';

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

  run: async function (client, message, args) {
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

    /** if queue existed before the play request */
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
      if (oldQueue) {
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
      if (error instanceof Error) {
        console.error(error);
        return sendError(error.message, message.channel);
      }
    }
  },
  interaction: {
    options: [
      {
        name: 'play',
        description: 'Play the song',
        type: 'STRING',
        required: true
      }
    ],
    run: async (client, interaction, { isGuildMember, isMessage }) => {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      const channel = interaction.member!.voice.channel;
      if (!channel) {
        return sendError(i18next.t('error.needvc'), interaction);
      }

      const searchTextOrUrl = interaction.options.getString('play', true);
      if (!interaction.channel) {
        return;
      }
      let subscription = queue.get(interaction.guild!.id);

      const searchtext = await interaction.reply({
        embeds: [{ description: i18next.t('searching') } as MessageEmbedOptions],
        fetchReply: true
      });

      if (!isMessage(searchtext)) {
        return;
      }

      /** if queue existed before the play request */
      const oldQueue = !!subscription;

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

      const track = await Track.from(
        [searchTextOrUrl],
        { author: interaction.user },
        {
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
              : interaction.followUp({ embeds: [embed] });
          },
          onFinish() {
            Stats.songsPlayed++;
          },
          onError(error) {
            console.error(error);
            return sendError(error.message, interaction);
          }
        }
      );
      subscription.enqueue(track);
      if (oldQueue) {
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
          : interaction.followUp({ embeds: [embed] });
      }
    }
  }
} as Command;
