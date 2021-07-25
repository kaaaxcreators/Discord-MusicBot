import { Client, Message, MessageEmbedOptions } from 'discord.js';
import i18next from 'i18next';

import { Command, queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'loop',
    description: i18next.t('loop.description'),
    usage: '',
    aliases: ['l'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    if (
      !message.member?.voice.channel ||
      message.member?.voice.channel != message.guild?.me?.voice.channel
    ) {
      return sendError(i18next.t('error.samevc'), message.channel);
    }
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue) {
      serverQueue.loop = !serverQueue.loop;
      return message.channel.send({
        embed: {
          color: 'GREEN',
          description: i18next.t('loop.status', {
            status:
              serverQueue.loop === true ? i18next.t('loop.enabled') : i18next.t('loop.disabled')
          })
        } as MessageEmbedOptions
      });
    }
    return sendError(i18next.t('error.noqueue'), message.channel);
  }
} as Command;
