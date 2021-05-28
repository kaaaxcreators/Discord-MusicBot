import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'earrape',
    description: i18n.__('earrape.description'),
    usage: '',
    aliases: [],
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
    )
      return sendError(i18n.__('error.samevc'), message.channel);
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError(i18n.__('error.noqueue'), message.channel);
    if (!serverQueue.connection) return sendError(i18n.__('error.noqueue'), message.channel);
    // Detect if earrape Mode is toggled with fixed volume (probably bad, but otherwise I would need persistence (e.g. db))
    const volume = serverQueue.volume == 696 ? 80 : 696;
    serverQueue.volume = volume;
    serverQueue.connection.dispatcher.setVolumeLogarithmic(volume / 100);
    const embed = new MessageEmbed()
      .setDescription(i18n.__mf('earrape.embed.description', { volume: volume / 1 }))
      .setAuthor(
        i18n.__('earrape.embed.author'),
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send(embed);
  }
} as Command;
