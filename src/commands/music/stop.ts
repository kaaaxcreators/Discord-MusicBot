import { Client, Message } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'stop',
    description: i18n.__('stop.description'),
    usage: '',
    aliases: [],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel!;
    if (!channel) return sendError(i18n.__('error.needvc'), message.channel);
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError(i18n.__('stop.noting'), message.channel);
    if (!serverQueue.connection) return;
    if (!serverQueue.connection.dispatcher) return;
    try {
      serverQueue.connection.dispatcher.end();
    } catch (error) {
      message.guild!.me!.voice.channel!.leave();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18n.__('error.music')}: ${error}`, message.channel);
    }
    queue.delete(message.guild!.id);
    serverQueue.songs = [];
    message.react('✅');
  }
} as Command;
