import i18next from 'i18next';

import { Command, queue as Queue } from '../../index.js';
import { getPrefix } from '../../util/database.js';
import sendError from '../../util/error.js';
import console from '../../util/logger.js';

export default {
  info: {
    name: 'skipto',
    description: i18next.t('skipto.description'),
    usage: i18next.t('skipto.usage'),
    aliases: ['st'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client, message, args) {
    if (
      !message.member?.voice.channel ||
      message.member?.voice.channel != message.guild?.me?.voice.channel
    ) {
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    if (!args.length || isNaN(Number(args[0]))) {
      return message.channel
        .send({
          embeds: [
            {
              color: 'GREEN',
              description: i18next.t('skipto.missingargs', { prefix: await getPrefix(message) })!
            }
          ]
        })
        .catch(console.error);
    }

    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }
    // Cant skip to the current or not existing song
    if (!Number(args[0]) || Number(args[0]) === 1) {
      return sendError('Bad Value', message.channel);
    }
    if (Number(args[0]) > queue.queue.length) {
      return sendError(
        i18next.t('skipto.short', { songs: queue.queue.length }),
        message.channel
      ).catch(console.error);
    }

    if (queue.loop) {
      for (let i = 0; i < Number(args[0]) - 2; i++) {
        queue.queue.push(queue.queue.shift()!);
      }
    } else {
      queue.queue = queue.queue.slice(Number(args[0]) - 2);
    }

    queue.resume();

    try {
      queue.audioPlayer.stop(true);
    } catch (error) {
      queue.voiceChannel.guild.me?.voice.disconnect();
      Queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, message.channel);
    }

    queue.textChannel
      .send({
        embeds: [
          {
            color: 'GREEN',
            description: i18next.t('skipto.embed.description', {
              author: '<@' + message.author + '>',
              songs: Number(args[0]) - 1,
              interpolation: { escapeValue: false }
            })!
          }
        ]
      })
      .catch(console.error);
    message.react('✅');
  },
  interaction: {
    options: [
      {
        name: 'position',
        description: 'Position in the queue to skip to',
        type: 'INTEGER',
        required: true
      }
    ],
    run: async function (client, interaction, { isGuildMember }) {
      if (!isGuildMember(interaction.member)) {
        return;
      }
      if (
        !interaction.member?.voice.channel ||
        interaction.member?.voice.channel != interaction.guild?.me?.voice.channel
      ) {
        return sendError(i18next.t('error.samevc'), interaction);
      }
      const queue = Queue.get(interaction.guild!.id);
      if (!queue) {
        return sendError(i18next.t('error.noqueue'), interaction).catch(console.error);
      }
      const position = interaction.options.getInteger('position', true);
      // Cant skip to the current or not existing song
      if (position === 1) {
        return sendError('Bad Value', interaction);
      }
      if (position > queue.queue.length) {
        return sendError(
          i18next.t('skipto.short', { songs: queue.queue.length }),
          interaction
        ).catch(console.error);
      }

      if (queue.loop) {
        for (let i = 0; i < position - 2; i++) {
          queue.queue.push(queue.queue.shift()!);
        }
      } else {
        queue.queue = queue.queue.slice(position - 2);
      }

      queue.resume();

      try {
        queue.audioPlayer.stop(true);
      } catch (error) {
        queue.voiceChannel.guild.me?.voice.disconnect();
        Queue.delete(interaction.guild!.id);
        return sendError(`:notes: ${i18next.t('error.music')}: ${error}`, interaction);
      }

      queue.textChannel
        .send({
          embeds: [
            {
              color: 'GREEN',
              description: i18next.t('skipto.embed.description', {
                author: '<@' + interaction.user + '>',
                songs: position - 1,
                interpolation: { escapeValue: false }
              })!
            }
          ]
        })
        .catch(console.error);
      interaction.reply('✅');
    }
  }
} as Command;
