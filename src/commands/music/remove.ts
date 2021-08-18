import { Client, Message, MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';

import { Command, queue as Queue } from '../../index';
import { getPrefix } from '../../util/database';
import sendError from '../../util/error';
import console from '../../util/logger';

module.exports = {
  info: {
    name: 'remove',
    description: i18next.t('remove.description'),
    usage: i18next.t('remove.usage'),
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
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    const queue = Queue.get(message.guild!.id);
    if (!queue) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }
    const prefix = await getPrefix(message);
    if (!args.length) {
      return sendError(i18next.t('remove.missingargs', { prefix: prefix }), message.channel);
    }
    if (isNaN(Number(args[0]))) {
      return sendError(i18next.t('remove.missingargs', { prefix: prefix }), message.channel);
    }
    if (queue.queue.length == 1) {
      return sendError(i18next.t('error.noqueue'), message.channel).catch(console.error);
    }
    if (Number(args[0]) > queue.queue.length) {
      return sendError(
        i18next.t('remove.short', { songs: queue.queue.length }),
        message.channel
      ).catch(console.error);
    }
    try {
      const song = queue.queue.splice(Number(args[0]) - 1, 1);
      queue.textChannel
        .send({
          embeds: [
            {
              color: 'RED',
              description: i18next.t('remove.embed.description', { song: song[0].title })
            } as MessageEmbedOptions
          ]
        })
        .catch(console.error);
      message.react('✅');
    } catch (error) {
      return sendError(`:notes: ${i18next.t('error.possible')} ${error}`, message.channel);
    }
  }
} as Command;
