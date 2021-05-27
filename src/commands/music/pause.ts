import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'pause',
    description: i18n.__('pause.description'),
    usage: '',
    aliases: [],
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
    if (serverQueue && serverQueue.playing) {
      serverQueue.playing = false;
      try {
        serverQueue.connection!.dispatcher.pause();
      } catch (error) {
        queue.delete(message.guild!.id);
        return sendError(`:notes: ${i18n.__('error.music')}: ${error}`, message.channel);
      }
      const embed = new MessageEmbed()
        .setDescription(i18n.__('pause.embed.description'))
        .setColor('YELLOW')
        .setTitle(i18n.__('pause.embed.title'));
      return message.channel.send(embed);
    }
    return sendError(i18n.__('error.noqueue'), message.channel);
  }
} as Command;
