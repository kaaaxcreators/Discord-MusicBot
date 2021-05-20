import { Client, Message, MessageEmbed } from 'discord.js';

import { queue } from '../../index';
import sendError from '../../util/error';

module.exports = {
  info: {
    name: 'earrape',
    description: 'Toggle Earrape Mode',
    usage: '',
    aliases: []
  },

  run: async function (client: Client, message: Message) {
    const channel = message.member!.voice.channel;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError('There is nothing playing in this server.', message.channel);
    if (!serverQueue.connection)
      return sendError('There is nothing playing in this server.', message.channel);
    // Detect if earrape Mode is toggled with fixed volume (probably bad, but otherwise I would need persistence (e.g. db))
    const volume = serverQueue.volume == 696 ? 80 : 696;
    serverQueue.volume = volume;
    serverQueue.connection.dispatcher.setVolumeLogarithmic(volume / 100);
    const xd = new MessageEmbed()
      .setDescription(`I set the volume to: **${volume / 1}**`)
      .setAuthor(
        'Server Volume Manager',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send(xd);
  }
};
