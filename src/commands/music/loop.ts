import { Client, Message, MessageEmbedOptions } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'loop',
    description: i18n.__('loop.description'),
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
      return sendError(i18n.__('error.samevc'), message.channel);
    }
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue) {
      serverQueue.loop = !serverQueue.loop;
      return message.channel.send({
        embed: {
          color: 'GREEN',
          description: i18n.__mf('loop.status', {
            status: serverQueue.loop === true ? i18n.__('loop.enabled') : i18n.__('loop.disabled')
          })
        } as MessageEmbedOptions
      });
    }
    return sendError(i18n.__('error.noqueue'), message.channel);
  }
} as Command;
