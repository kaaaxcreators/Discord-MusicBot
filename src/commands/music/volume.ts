import { Client, Message, MessageEmbed } from 'discord.js';
import i18n from 'i18n';

import { Command, config, queue } from '../../index';
i18n.setLocale(config.LOCALE);
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'volume',
    description: i18n.__('volume.description'),
    usage: '[volume]',
    aliases: ['v', 'vol'],
    categorie: 'music',
    permissions: {
      channel: ['VIEW_CHANNEL', 'SEND_MESSAGES', 'EMBED_LINKS'],
      member: []
    }
  },

  run: async function (client: Client, message: Message, args: string[]) {
    if (message.member?.voice.channel != message.guild?.me?.voice.channel)
      return sendError(i18n.__('error.samevc'), message.channel);
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError(i18n.__('error.noqueue'), message.channel);
    if (!serverQueue.connection) return sendError(i18n.__('error.noqueue'), message.channel);
    if (!args[0])
      return message.channel.send(i18n.__mf('volume.current', { volume: serverQueue.volume }));
    if (isNaN(Number(args[0])))
      return message.channel
        .send(':notes: ' + i18n.__('volume.numbers'))
        .catch((err) => console.log(err));
    if (parseInt(args[0]) > 150 || Number(args[0]) < 0)
      return sendError(i18n.__('volume.between'), message.channel).catch((err) => console.log(err));
    serverQueue.volume = Number(args[0]);
    serverQueue.connection.dispatcher.setVolumeLogarithmic(Number(args[0]) / 100);
    const embed = new MessageEmbed()
      .setDescription(i18n.__mf('volume.embed.description', { volume: Number(args[0]) / 1 }))
      .setAuthor(
        'Server Volume Manager',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send(embed);
  }
} as Command;
