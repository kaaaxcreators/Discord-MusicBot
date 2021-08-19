import { Client, Message } from 'discord.js';
import i18next from 'i18next';

import { Command, queue as Queue } from '../../index';
import { getPrefix } from '../../util/database';
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
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

  run: async function (client: Client, message: Message, args: string[]) {
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
  }
} as Command;
