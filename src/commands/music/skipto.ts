import { Client, Message } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue as Queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
  info: {
    name: 'skipto',
    description: i18n.__('skipto.description'),
    usage: i18n.__('skipto.usage'),
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
      return sendError(i18n.__('error.samevc'), message.channel);
    }
    if (!args.length || isNaN(Number(args[0]))) {
      return message.channel
        .send({
          embed: {
            color: 'GREEN',
            description: i18n.__mf('skipto.missingargs', { prefix: config.prefix })
          }
        })
        .catch(console.error);
    }

    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18n.__('error.noqueue'), message.channel).catch(console.error);
    }
    if (Number(args[0]) > queue.songs.length) {
      return sendError(
        i18n.__mf('skipto.short', { songs: queue.songs.length }),
        message.channel
      ).catch(console.error);
    }

    queue.playing = true;

    if (queue.loop) {
      for (let i = 0; i < Number(args[0]) - 2; i++) {
        queue.songs.push(queue.songs.shift()!);
      }
    } else {
      queue.songs = queue.songs.slice(Number(args[0]) - 2);
    }
    try {
      queue.connection!.dispatcher.end();
    } catch (error) {
      queue.voiceChannel.leave();
      Queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18n.__('error.music')}: ${error}`, message.channel);
    }

    queue.textChannel
      .send({
        embed: {
          color: 'GREEN',
          description: i18n.__mf('skipto.embed.description', {
            author: '<@' + message.author + '>',
            songs: Number(args[0]) - 1
          })
        }
      })
      .catch(console.error);
    message.react('✅');
  }
} as Command;
