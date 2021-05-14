import { Client, Message, MessageEmbed } from 'discord.js';

import { queue } from '../index';
import sendError from '../util/error';

module.exports = {
  info: {
    name: 'volume',
    description: 'To change the server song queue volume',
    usage: '[volume]',
    aliases: ['v', 'vol']
  },

  run: async function (client: Client, message: Message, args: string[]) {
    const channel = message.member!.voice.channel!;
    if (!channel)
      return sendError(
        "I'm sorry but you need to be in a voice channel to play music!",
        message.channel
      );
    const serverQueue = queue.get(message.guild!.id);
    if (!serverQueue) return sendError('There is nothing playing in this server.', message.channel);
    if (!serverQueue.connection)
      return sendError('There is nothing playing in this server.', message.channel);
    if (!args[0]) return message.channel.send(`The current volume is: **${serverQueue.volume}**`);
    if (isNaN(Number(args[0])))
      return message.channel.send(':notes: Numbers only!').catch((err) => console.log(err));
    if (parseInt(args[0]) > 150 || Number(args[0]) < 0)
      return sendError(
        "You can't set the volume more than 150. or lower than 0",
        message.channel
      ).catch((err) => console.log(err));
    serverQueue.volume = Number(args[0]);
    serverQueue.connection.dispatcher.setVolumeLogarithmic(Number(args[0]) / 100);
    const xd = new MessageEmbed()
      .setDescription(`I set the volume to: **${Number(args[0]) / 1}/100**`)
      .setAuthor(
        'Server Volume Manager',
        'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
      )
      .setColor('BLUE');
    return message.channel.send(xd);
  }
};
