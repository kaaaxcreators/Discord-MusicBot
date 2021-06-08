import { Client, Message, MessageEmbedOptions } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue as Queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
  info: {
    name: 'remove',
    description: i18n.__('remove.description'),
    usage: i18n.__('remove.usage'),
    aliases: ['rm'],
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
    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18n.__('error.noqueue'), message.channel).catch(console.error);
    }
    if (!args.length) {
      return sendError(i18n.__mf('remove.missingargs', { prefix: config.prefix }), message.channel);
    }
    if (isNaN(Number(args[0]))) {
      return sendError(i18n.__mf('remove.missingargs', { prefix: config.prefix }), message.channel);
    }
    if (queue.songs.length == 1) {
      return sendError(i18n.__('error.noqueue'), message.channel).catch(console.error);
    }
    if (Number(args[0]) > queue.songs.length) {
      return sendError(
        i18n.__mf('remove.short', { songs: queue.songs.length }),
        message.channel
      ).catch(console.error);
    }
    try {
      const song = queue.songs.splice(Number(args[0]) - 1, 1);
      queue.textChannel
        .send({
          embed: {
            color: 'RED',
            description: i18n.__mf('remove.embed.description', { song: song[0].title })
          } as MessageEmbedOptions
        })
        .catch(console.error);
      message.react('✅');
    } catch (error) {
      return sendError(`:notes: ${i18n.__('error.possible')} ${error}`, message.channel);
    }
  }
} as Command;
