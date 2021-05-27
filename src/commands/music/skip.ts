import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'skip',
    description: i18n.__('skip.description'),
    usage: '',
    aliases: ['s'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message) {
    if (message.member?.voice.channel != message.guild?.me?.voice.channel)
      return sendError(i18n.__('error.samevc'), message.channel);
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError(i18n.__('skip.nothing'), message.channel);
    if (!serverQueue.connection) return;
    if (!serverQueue.connection.dispatcher) return;
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection.dispatcher.resume();
      const embed = new MessageEmbed()
        .setDescription(i18n.__('resume.embed.description'))
        .setColor('YELLOW')
        .setTitle(i18n.__('resume.embed.author'));

      return message.channel.send(embed).catch();
    }

    try {
      serverQueue.connection.dispatcher.end();
    } catch (error) {
      serverQueue.voiceChannel.leave();
      queue.delete(message.guild!.id);
      return sendError(`:notes: ${i18n.__('error.music')}: ${error}`, message.channel);
    }
    message.react('✅');
  }
} as Command;
