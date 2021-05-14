import { Client, Message, MessageEmbed } from 'discord.js';

import { queue } from '../index';
import sendError from '../util/error';

module.exports = {
  info: {
    name: 'resume',
    description: 'To resume the paused music',
    usage: '',
    aliases: []
  },

  run: async function (client: Client, message: Message) {
    const serverQueue = queue.get(message.guild!.id);
    if (serverQueue && !serverQueue.playing) {
      serverQueue.playing = true;
      serverQueue.connection!.dispatcher.resume();
      const xd = new MessageEmbed()
        .setDescription('▶ Resumed the music for you!')
        .setColor('YELLOW')
        .setAuthor(
          'Music has been Resumed!',
          'https://raw.githubusercontent.com/kaaaxcreators/discordjs/master/assets/Music.gif'
        );
      return message.channel.send(xd);
    }
    return sendError('There is nothing playing in this server.', message.channel);
  }
};
